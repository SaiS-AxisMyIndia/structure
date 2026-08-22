<?php

declare(strict_types=1);

namespace ProSql\Schema;

/**
 * What SchemaDiffer found for one entity's table — the input SchemaBuilder
 * turns into actual DDL. `missingColumns` are safe to just ADD;
 * `changedColumns` (existing column, different type/nullability) are
 * "complex" — SchemaBuilder only ever applies those under
 * TABLE_WRITE=force, deferring them to the migration script otherwise.
 * `extraColumns` (in the database, not on the entity) are purely
 * informational — nothing in this package ever drops a column
 * automatically, in any mode; see SchemaBuilder's docblock for why.
 */
final class TableDiff
{
    /**
     * @param list<ColumnDefinition> $missingColumns
     * @param list<ColumnDefinition> $changedColumns
     * @param list<string> $extraColumns
     */
    public function __construct(
        public readonly EntityDefinition $entity,
        public readonly bool $isNewTable,
        public readonly array $missingColumns,
        public readonly array $changedColumns,
        public readonly array $extraColumns,
    ) {
    }

    public function isEmpty(): bool
    {
        return !$this->isNewTable && $this->missingColumns === [] && $this->changedColumns === [];
    }
}
