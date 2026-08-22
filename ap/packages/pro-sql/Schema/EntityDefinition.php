<?php

declare(strict_types=1);

namespace ProSql\Schema;

use LogicException;

/**
 * What EntityScanner::scan() produces for one #[ProEntity]-carrying
 * class — its table name plus every column it declares. Everything
 * downstream (SchemaDiffer, DdlGenerator) works off this, never off the
 * entity class or its Reflection directly.
 */
final class EntityDefinition
{
    /**
     * @param class-string $class
     * @param list<ColumnDefinition> $columns
     * @param list<list<string>> $uniqueGroups each entry is 2+ column
     *        names (from #[UniqueMap]) that must be jointly unique —
     *        already deduped, so declaring the same pair on both sides
     *        only ever produces one entry here
     */
    public function __construct(
        public readonly string $class,
        public readonly string $table,
        public readonly array $columns,
        public readonly array $uniqueGroups = [],
    ) {
    }

    /** EntityScanner guarantees exactly one column has primary: true — see its docblock. */
    public function primaryColumn(): ColumnDefinition
    {
        foreach ($this->columns as $column) {
            if ($column->primary) {
                return $column;
            }
        }

        throw new LogicException(
            "{$this->class} has no primary column — EntityScanner should have rejected this before an EntityDefinition ever existed.",
        );
    }
}
