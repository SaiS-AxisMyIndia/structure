<?php

declare(strict_types=1);

namespace ProSql\Schema;

/**
 * Compares an EntityDefinition against what SchemaInspector finds in the
 * database right now, producing one TableDiff. Pure comparison logic —
 * no SQL is generated here (see DdlGenerator) and nothing is applied
 * (see SchemaBuilder).
 */
final class SchemaDiffer
{
    public function __construct(private readonly SchemaInspector $inspector)
    {
    }

    public function diff(EntityDefinition $entity): TableDiff
    {
        $actual = $this->inspector->columns($entity->table);

        if ($actual === null) {
            return new TableDiff($entity, true, $entity->columns, [], []);
        }

        $missing = [];
        $changed = [];
        $declaredNames = [];

        foreach ($entity->columns as $column) {
            $declaredNames[$column->name] = true;

            if (!isset($actual[$column->name])) {
                $missing[] = $column;

                continue;
            }

            if (!self::matches($column, $actual[$column->name])) {
                $changed[] = $column;
            }
        }

        $extra = array_values(array_diff(array_keys($actual), array_keys($declaredNames)));

        return new TableDiff($entity, false, $missing, $changed, $extra);
    }

    /** @param array{sqlType: string, nullable: bool} $actual */
    private static function matches(ColumnDefinition $expected, array $actual): bool
    {
        return self::normalize($expected->sqlType) === self::normalize($actual['sqlType'])
            && $expected->nullable === $actual['nullable'];
    }

    /**
     * Uppercases + collapses whitespace, then strips integer display
     * widths (INT(10) -> INT) — deprecated, storage/range-irrelevant,
     * and MySQL 8.0.19+ stops reporting them for non-ZEROFILL columns at
     * all. Left un-stripped, a column this package generated as `INT
     * UNSIGNED` would forever "differ" from what an older/differently
     * configured MySQL reports back as `INT(10) UNSIGNED`, even though
     * nothing about the column actually changed. VARCHAR/CHAR's length
     * is NOT stripped — there it's a real, meaningful difference.
     */
    private static function normalize(string $sqlType): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim(strtoupper($sqlType)));

        return preg_replace('/^(TINYINT|SMALLINT|MEDIUMINT|INT|BIGINT)\(\d+\)/', '$1', $normalized);
    }
}
