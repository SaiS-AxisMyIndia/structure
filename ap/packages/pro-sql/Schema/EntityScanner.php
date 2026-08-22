<?php

declare(strict_types=1);

namespace ProSql\Schema;

use LogicException;
use ProSql\Attributes\Link;
use ProSql\Attributes\Primary;
use ProSql\Attributes\PrimaryType;
use ProSql\Attributes\ProEntity;
use ProSql\Attributes\Timestamp;
use ProSql\Attributes\Unique;
use ProSql\Attributes\UniqueMap;
use ReflectionClass;
use ReflectionNamedType;
use ReflectionProperty;
use ReflectionUnionType;

/**
 * Reflects a #[ProEntity]-carrying class into an EntityDefinition —
 * turning what SchemaBuilder actually needs (a table name and a flat
 * list of columns) out of a class's attributes, the same idea as
 * RouteCompiler turning a controller's attributes into a route table.
 * Every public, non-static, typed property becomes exactly one column:
 *
 *   - #[Primary('int'|'uuid'|'bigint')]   -> that column, PRIMARY KEY + (for int/bigint) AUTO_INCREMENT
 *   - #[Timestamp(current:, update:)]      -> a DATETIME column with the matching DEFAULT/ON UPDATE
 *   - #[Link('table.column')]              -> a normal column (typed off the property, like below) plus a foreign key
 *   - none of the above                    -> a plain column, SQL type mapped from the property's own PHP type
 *
 * #[Unique] combines with any of those (this column alone must be
 * unique — a no-op, but not an error, on an already-#[Primary] column,
 * which is implicitly unique already). #[UniqueMap('table.column')]
 * combines too, but describes something no single ColumnDefinition can
 * hold on its own — see EntityDefinition::$uniqueGroups.
 *
 * V1 deliberately only understands string/int/float/bool (plus an
 * explicit `?Type`/`Type|null` for nullable) — no arrays, no objects,
 * no enums, no untyped properties. Anything else throws immediately
 * rather than silently guessing a column type. Likewise every entity
 * must declare EXACTLY ONE #[Primary] property — no composite keys yet.
 */
final class EntityScanner
{
    /** @param class-string $class */
    public static function scan(string $class): EntityDefinition
    {
        $reflection = new ReflectionClass($class);
        $entityAttributes = $reflection->getAttributes(ProEntity::class);

        if ($entityAttributes === []) {
            throw new LogicException("$class is listed as an entity but carries no #[ProEntity] attribute.");
        }

        $table = $entityAttributes[0]->newInstance()->table;
        $columns = [];
        $primaryCount = 0;
        /** @var list<array{0: string, 1: string}> $uniqueMapPairs [propertyName, referencedColumnName] */
        $uniqueMapPairs = [];

        foreach ($reflection->getProperties(ReflectionProperty::IS_PUBLIC) as $property) {
            if ($property->isStatic()) {
                continue;
            }

            $column = self::columnFor($class, $property);
            $columns[] = $column;

            if ($column->primary) {
                $primaryCount++;
            }

            foreach ($property->getAttributes(UniqueMap::class) as $attribute) {
                $uniqueMapPairs[] = self::uniqueMapPair($class, $table, $property, $attribute->newInstance());
            }
        }

        if ($primaryCount !== 1) {
            throw new LogicException(sprintf(
                '%s must declare exactly one #[Primary] property; found %d.',
                $class,
                $primaryCount,
            ));
        }

        return new EntityDefinition($class, $table, $columns, self::buildUniqueGroups($class, $columns, $uniqueMapPairs));
    }

    private static function columnFor(string $class, ReflectionProperty $property): ColumnDefinition
    {
        $name = $property->getName();
        $unique = $property->getAttributes(Unique::class) !== [];

        $primaryAttributes = $property->getAttributes(Primary::class);

        if ($primaryAttributes !== []) {
            return self::primaryColumn($name, $primaryAttributes[0]->newInstance(), $unique);
        }

        $timestampAttributes = $property->getAttributes(Timestamp::class);

        if ($timestampAttributes !== []) {
            return self::timestampColumn($name, $timestampAttributes[0]->newInstance(), $unique);
        }

        [$sqlType, $nullable] = self::sqlTypeFor($class, $property);

        $linkAttributes = $property->getAttributes(Link::class);

        if ($linkAttributes !== []) {
            $link = $linkAttributes[0]->newInstance();

            return new ColumnDefinition(
                name: $name,
                sqlType: $sqlType,
                nullable: $nullable,
                references: ['table' => $link->table, 'column' => $link->column],
                unique: $unique,
            );
        }

        return new ColumnDefinition(name: $name, sqlType: $sqlType, nullable: $nullable, unique: $unique);
    }

    private static function primaryColumn(string $name, Primary $primary, bool $unique): ColumnDefinition
    {
        return match ($primary->type) {
            // UNSIGNED — a primary key is never meant to go negative, and
            // it buys the extra headroom (0..4294967295 vs a signed INT's
            // half of that) for free. $unique threaded through for
            // consistency (nothing silently drops a declared attribute),
            // even though DdlGenerator never actually emits UNIQUE for an
            // already-PRIMARY KEY column — see its own docblock.
            PrimaryType::Int => new ColumnDefinition($name, 'INT UNSIGNED', primary: true, autoIncrement: true, unique: $unique),
            PrimaryType::Bigint => new ColumnDefinition($name, 'BIGINT UNSIGNED', primary: true, autoIncrement: true, unique: $unique),
            // No AUTO_INCREMENT for a uuid — the application (or a
            // DEFAULT expression a future version might add) supplies it,
            // not MySQL.
            PrimaryType::Uuid => new ColumnDefinition($name, 'CHAR(36)', primary: true, unique: $unique),
        };
    }

    private static function timestampColumn(string $name, Timestamp $timestamp, bool $unique): ColumnDefinition
    {
        return new ColumnDefinition(
            name: $name,
            sqlType: 'DATETIME',
            // Only nullable when it has no default to fall back on —
            // current: true means MySQL always fills it in, so NOT NULL
            // is safe; current: false with no value supplied would
            // otherwise 500 on every insert that doesn't set it by hand.
            nullable: !$timestamp->current,
            defaultCurrentTimestamp: $timestamp->current,
            onUpdateCurrentTimestamp: $timestamp->update,
            unique: $unique,
        );
    }

    /** @return array{0: string, 1: string} [propertyName, referencedColumnName] */
    private static function uniqueMapPair(string $class, string $table, ReflectionProperty $property, UniqueMap $uniqueMap): array
    {
        $propertyName = $property->getName();

        if ($uniqueMap->table !== $table) {
            throw new LogicException(sprintf(
                '%s::$%s\'s #[UniqueMap] points at table "%s", but this entity maps to "%s" — '
                    . 'a composite unique constraint only makes sense within the same table.',
                $class,
                $propertyName,
                $uniqueMap->table,
                $table,
            ));
        }

        if ($uniqueMap->column === $propertyName) {
            throw new LogicException("{$class}::\${$propertyName}'s #[UniqueMap] can't reference itself.");
        }

        return [$propertyName, $uniqueMap->column];
    }

    /**
     * Normalizes every #[UniqueMap] pair (order doesn't matter — declared
     * on either column, or both, produces exactly one group) and checks
     * each referenced column is actually one this entity declares.
     *
     * @param list<ColumnDefinition> $columns
     * @param list<array{0: string, 1: string}> $pairs
     * @return list<list<string>>
     */
    private static function buildUniqueGroups(string $class, array $columns, array $pairs): array
    {
        $columnNames = array_map(static fn (ColumnDefinition $c): string => $c->name, $columns);
        $seen = [];
        $groups = [];

        foreach ($pairs as [$propertyName, $referencedColumn]) {
            if (!in_array($referencedColumn, $columnNames, true)) {
                throw new LogicException(
                    "{$class}::\${$propertyName}'s #[UniqueMap] references \"{$referencedColumn}\", "
                        . 'which isn\'t a property this entity declares.',
                );
            }

            $group = [$propertyName, $referencedColumn];
            sort($group);
            $key = implode("\0", $group);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $groups[] = $group;
        }

        return $groups;
    }

    /** @return array{0: string, 1: bool} [sqlType, nullable] */
    private static function sqlTypeFor(string $class, ReflectionProperty $property): array
    {
        $type = $property->getType();
        $label = "{$class}::\${$property->getName()}";

        if ($type === null) {
            throw new LogicException("$label has no declared type — every property EntityScanner reads must be typed.");
        }

        if ($type instanceof ReflectionUnionType) {
            $names = array_map(static fn ($t): string => (string) $t, $type->getTypes());
            $nonNull = array_values(array_diff($names, ['null']));

            if (count($names) !== 2 || count($nonNull) !== 1) {
                throw new LogicException("$label's union type (\"" . implode('|', $names) . "\") isn't supported — only a plain type or \"Type|null\" is.");
            }

            return [self::sqlTypeForName($label, $nonNull[0]), true];
        }

        if (!$type instanceof ReflectionNamedType) {
            throw new LogicException("$label has an unsupported property type.");
        }

        return [self::sqlTypeForName($label, $type->getName()), $type->allowsNull()];
    }

    private static function sqlTypeForName(string $label, string $typeName): string
    {
        return match ($typeName) {
            'string' => 'VARCHAR(255)',
            'int' => 'INT',
            'float' => 'DOUBLE',
            'bool' => 'TINYINT(1)',
            default => throw new LogicException(
                "$label has type \"$typeName\", which EntityScanner doesn't know how to map to a SQL column "
                . '(supported: string, int, float, bool — or mark it #[Primary]/#[Link]/#[Timestamp]).',
            ),
        };
    }
}
