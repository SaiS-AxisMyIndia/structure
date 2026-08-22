<?php

declare(strict_types=1);

namespace ProSql\Schema;

/**
 * One expected column, as derived from an entity property by
 * EntityScanner — table-agnostic (it doesn't know its own table name;
 * EntityDefinition holds the list of these alongside the table). Used
 * both to generate DDL (DdlGenerator) and to compare against what
 * SchemaInspector finds actually in the database (SchemaDiffer).
 */
final class ColumnDefinition
{
    /**
     * @param string $sqlType a full MySQL column type, e.g. "VARCHAR(255)", "INT UNSIGNED", "DATETIME"
     * @param array{table: string, column: string}|null $references set only for a #[Link]'d column
     */
    public function __construct(
        public readonly string $name,
        public readonly string $sqlType,
        public readonly bool $nullable = false,
        public readonly bool $primary = false,
        public readonly bool $autoIncrement = false,
        public readonly bool $defaultCurrentTimestamp = false,
        public readonly bool $onUpdateCurrentTimestamp = false,
        public readonly ?array $references = null,
        // From #[Unique] — this column alone must be unique. A composite
        // "these columns together must be unique" (#[UniqueMap]) lives on
        // EntityDefinition::$uniqueGroups instead, not here — it isn't a
        // property of one column.
        public readonly bool $unique = false,
    ) {
    }
}
