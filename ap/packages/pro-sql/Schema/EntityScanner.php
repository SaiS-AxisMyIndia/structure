<?php

declare(strict_types=1);

namespace ProSql\Schema;

use BackedEnum;
use LogicException;
use ProSql\Attributes\Enum;
use ProSql\Attributes\Link;
use ProSql\Attributes\Primary;
use ProSql\Attributes\PrimaryType;
use ProSql\Attributes\ProEntity;
use ProSql\Attributes\Timestamp;
use ProSql\Attributes\Unique;
use ProSql\Attributes\UniqueMap;
use ReflectionClass;
use ReflectionEnum;
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
 *   - #[Enum([...])]                       -> see enumColumn(): ENUM(...) for a string-valued list, INT + CHECK for an int-valued one
 *   - #[Link('table.column')]              -> a normal column (typed off the property, like below) plus a foreign key
 *   - none of the above                    -> a plain column, SQL type mapped from the property's own PHP type
 *
 * #[Unique] combines with any of those (this column alone must be
 * unique — a no-op, but not an error, on an already-#[Primary] column,
 * which is implicitly unique already). #[UniqueMap('table.column')]
 * combines too, but describes something no single ColumnDefinition can
 * hold on its own — see EntityDefinition::$uniqueGroups.
 *
 * V1 deliberately only understands string/int/float/bool, a
 * string-backed enum (-> MySQL's own ENUM(...), one quoted case value
 * per member — see sqlTypeForEnum()), plus an explicit `?Type`/`Type|null`
 * for nullable — no arrays, no plain objects, no int-backed or unbacked
 * enums, no untyped properties. Anything else throws immediately rather
 * than silently guessing a column type. Likewise every entity must
 * declare EXACTLY ONE #[Primary] property — no composite keys yet.
 */
final class EntityScanner
{
    /**
     * @param class-string $class
     * @param list<class-string> $allEntityClasses every entity `gg
     *        build` knows about (Runner::get('entities')) — needed
     *        ONLY to resolve a #[Link] column's SQL type against
     *        whatever the REFERENCED entity's own #[Primary] actually
     *        is (see columnFor()/referencedPrimaryKeySqlType()); an
     *        entity with no #[Link] properties never touches this list
     *        at all. Omitted (or the referenced entity isn't in it), a
     *        #[Link] column falls back to whatever its own PHP property
     *        type would map to — which risks a type MISMATCH against
     *        the referenced column InnoDB won't accept a foreign key
     *        across (see the same method's own comment).
     */
    public static function scan(string $class, array $allEntityClasses = []): EntityDefinition
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

            $column = self::columnFor($class, $property, $allEntityClasses);
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

    /** @param list<class-string> $allEntityClasses */
    private static function columnFor(string $class, ReflectionProperty $property, array $allEntityClasses): ColumnDefinition
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

        $enumAttributes = $property->getAttributes(Enum::class);

        if ($enumAttributes !== []) {
            return self::enumColumn($class, $property, $enumAttributes[0]->newInstance(), $unique);
        }

        [$sqlType, $nullable] = self::sqlTypeFor($class, $property);

        $linkAttributes = $property->getAttributes(Link::class);

        if ($linkAttributes !== []) {
            $link = $linkAttributes[0]->newInstance();

            // MUST match the referenced column's real type exactly — a
            // foreign key between a CHAR(36) uuid primary key and a
            // VARCHAR(255) (what a plain `string $fooId` property would
            // otherwise map to on its own) fails InnoDB's constraint
            // check even for values that are logically equal (it
            // compares raw index bytes, which a CHAR column's
            // fixed-length padding changes) — see
            // referencedPrimaryKeySqlType()'s own comment.
            $sqlType = self::referencedPrimaryKeySqlType($link->table, $allEntityClasses) ?? $sqlType;

            return new ColumnDefinition(
                name: $name,
                sqlType: $sqlType,
                nullable: $nullable,
                references: [
                    'table' => $link->table,
                    'column' => $link->column,
                    'onDelete' => $link->onDelete?->value,
                    'onUpdate' => $link->onUpdate?->value,
                ],
                unique: $unique,
            );
        }

        return new ColumnDefinition(name: $name, sqlType: $sqlType, nullable: $nullable, unique: $unique);
    }

    /**
     * Finds, among $allEntityClasses, the one whose #[ProEntity] maps to
     * $table, and returns its #[Primary] column's actual SQL type
     * (`CHAR(36)` for uuid, `INT UNSIGNED`/`BIGINT UNSIGNED` for
     * int/bigint) — or null if no entity in the list maps to that table,
     * or that entity declares no #[Primary] at all (both cases: the
     * caller falls back to the #[Link] property's own PHP type, its only
     * option without this).
     *
     * @param list<class-string> $allEntityClasses
     */
    private static function referencedPrimaryKeySqlType(string $table, array $allEntityClasses): ?string
    {
        foreach ($allEntityClasses as $entityClass) {
            $reflection = new ReflectionClass($entityClass);
            $entityAttributes = $reflection->getAttributes(ProEntity::class);

            if ($entityAttributes === [] || $entityAttributes[0]->newInstance()->table !== $table) {
                continue;
            }

            foreach ($reflection->getProperties(ReflectionProperty::IS_PUBLIC) as $property) {
                $primaryAttributes = $property->getAttributes(Primary::class);

                if ($primaryAttributes !== []) {
                    return self::primaryColumn($property->getName(), $primaryAttributes[0]->newInstance(), false)->sqlType;
                }
            }
        }

        return null;
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
            // No AUTO_INCREMENT for a uuid — the DEFAULT (...) expression
            // DdlGenerator builds from $primary->version is only a
            // backstop for whatever insert path doesn't supply one
            // itself (see ColumnDefinition::$uuidVersion); the
            // application (ProRepo::newPrimaryKey()) supplies the real
            // one MySQL's own lastInsertId()-less INSERT can't hand back.
            PrimaryType::Uuid => new ColumnDefinition($name, 'CHAR(36)', primary: true, unique: $unique, uuidVersion: $primary->version),
        };
    }

    /**
     * #[Enum]'s values decide the SQL shape, same split as
     * sqlTypeForEnum() for a real PHP enum — see that attribute's own
     * docblock for why: a STRING-valued list becomes MySQL's own
     * ENUM(...); an INT-valued one keeps the column a real INT and adds
     * a `CHECK (... IN (...))` constraint instead of ENUM(...), since
     * ENUM sorts by definition position, not the label's numeric value.
     *
     * Either way the property's own declared type must actually MATCH
     * (string/?string for a string-valued #[Enum], int/?int for an
     * int-valued one) — reusing sqlTypeFor() both derives $nullable and
     * gets this check for free, since a mismatched type simply won't
     * equal the SQL type #[Enum] itself demands.
     */
    private static function enumColumn(string $class, ReflectionProperty $property, Enum $enum, bool $unique): ColumnDefinition
    {
        $name = $property->getName();
        $label = "{$class}::\${$name}";
        [$declaredSqlType, $nullable] = self::sqlTypeFor($class, $property);

        if ($enum->isStringBacked()) {
            if ($declaredSqlType !== 'VARCHAR(255)') {
                throw new LogicException(
                    "$label has a string-valued #[Enum] but isn't typed `string`/`?string` "
                    . "(resolved to SQL type \"$declaredSqlType\" instead).",
                );
            }

            return new ColumnDefinition(
                name: $name,
                sqlType: 'ENUM(' . self::quotedEnumValues($enum->values) . ')',
                nullable: $nullable,
                unique: $unique,
                index: $enum->index,
            );
        }

        if ($declaredSqlType !== 'INT') {
            throw new LogicException(
                "$label has an integer-valued #[Enum] but isn't typed `int`/`?int` "
                . "(resolved to SQL type \"$declaredSqlType\" instead).",
            );
        }

        return new ColumnDefinition(
            name: $name,
            sqlType: 'INT',
            nullable: $nullable,
            unique: $unique,
            checkValues: $enum->values,
            index: $enum->index,
        );
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
            default => enum_exists($typeName)
                ? self::sqlTypeForEnum($label, $typeName)
                : throw new LogicException(
                    "$label has type \"$typeName\", which EntityScanner doesn't know how to map to a SQL column "
                    . '(supported: string, int, float, bool, a string-backed enum — or mark it #[Primary]/#[Link]/#[Timestamp]).',
                ),
        };
    }

    /**
     * A string-backed enum maps to MySQL's own ENUM(...) type, one
     * quoted case value per member:
     *
     *   enum ProductStatus: string { case Draft = 'draft'; case Published = 'published'; }
     *   // -> ENUM('draft','published')
     *
     * No space after each comma — deliberately matching MySQL's own
     * canonical COLUMN_TYPE rendering exactly (confirmed against a real
     * server), since SchemaDiffer::matches() compares this string
     * against that verbatim (after only upper-casing + whitespace
     * collapsing — see its own docblock on why VARCHAR/CHAR length
     * isn't stripped either): a stray space here would make every
     * enum column look "changed" on every single build, forever.
     *
     * Only a STRING-backed enum is supported — an int-backed or
     * unbacked enum has no literal value list ENUM(...) could use, and
     * silently falling back to a plain INT would throw away the enum's
     * own labels, which defeats the point of declaring one.
     */
    private static function sqlTypeForEnum(string $label, string $enumClass): string
    {
        $reflection = new ReflectionEnum($enumClass);

        if (!$reflection->isBacked() || (string) $reflection->getBackingType() !== 'string') {
            throw new LogicException(
                "$label is enum \"$enumClass\", but only a STRING-backed enum (`enum X: string { ... }`) "
                . 'maps to a SQL column — an int-backed or unbacked enum has no literal value ENUM(...) can use.',
            );
        }

        $cases = $enumClass::cases();

        if ($cases === []) {
            throw new LogicException("$label is enum \"$enumClass\", which declares no cases — ENUM(...) needs at least one.");
        }

        $values = array_map(static fn (BackedEnum $case): string => (string) $case->value, $cases);

        return 'ENUM(' . self::quotedEnumValues($values) . ')';
    }

    /**
     * Shared by sqlTypeForEnum() (a real PHP enum's cases) and
     * enumColumn() (#[Enum]'s own $values) — the exact same quoting
     * rule either way, since ENUM(...) doesn't care which path produced
     * its value list. No space after each comma — see sqlTypeForEnum()'s
     * own docblock for why that matters (SchemaDiffer compares this
     * text verbatim against MySQL's own canonical rendering).
     *
     * @param list<string> $values
     */
    private static function quotedEnumValues(array $values): string
    {
        return implode(',', array_map(
            static fn (string $value): string => "'" . str_replace("'", "''", $value) . "'",
            $values,
        ));
    }
}
