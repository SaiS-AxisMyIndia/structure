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
     * @param array{table: string, column: string, onDelete: ?string, onUpdate: ?string}|null $references
     *        set only for a #[Link]'d column; onDelete/onUpdate are a ReferentialAction's ->value
     *        (e.g. "CASCADE"), or null when that clause wasn't declared — see Link's docblock
     */
    public function __construct(
        public readonly string $name,
        public readonly string $sqlType,
        public readonly bool $nullable = false,
        public readonly bool $primary = false,
        public readonly bool $autoIncrement = false,
        public readonly bool $defaultCurrentTimestamp = false,
        public readonly bool $onUpdateCurrentTimestamp = false,
        // A uuid #[Primary]'s version (4 or 6; null for anything else) —
        // which DEFAULT (...) expression DdlGenerator emits (MySQL
        // 8.0.13+'s expression-default syntax, not a literal). Purely a
        // backstop for an insert that bypasses ProRepo::newPrimaryKey()
        // (a raw SQL insert, a manual one via Adminer/SQLTools, ...):
        // ProRepo's own create() always supplies an id explicitly, since
        // MySQL has no RETURNING clause — LAST_INSERT_ID() (what
        // QueryBuilder::insert() reports back) can't reflect whatever
        // this DEFAULT would have generated. See
        // EntityScanner::primaryColumn().
        public readonly ?int $uuidVersion = null,
        public readonly ?array $references = null,
        // From #[Unique] — this column alone must be unique. A composite
        // "these columns together must be unique" (#[UniqueMap]) lives on
        // EntityDefinition::$uniqueGroups instead, not here — it isn't a
        // property of one column.
        public readonly bool $unique = false,
        // From an int-valued #[Enum] — the exact allowed values, in
        // declaration order. Set ONLY there: a string-valued #[Enum] (or
        // a real string-backed PHP enum) needs no separate list, since
        // its values already ARE $sqlType (ENUM('a','b',...)) — see
        // EntityScanner::enumColumn(). DdlGenerator turns this into an
        // inline `CHECK (... IN (...))` on the column.
        //
        // @var list<int>|null
        public readonly ?array $checkValues = null,
        // From #[Enum(index: true)] — a plain, non-unique index. Unlike
        // $unique/$checkValues this isn't a property EntityScanner ever
        // sets on its own; it only ever comes from that one attribute.
        public readonly bool $index = false,
    ) {
    }
}
