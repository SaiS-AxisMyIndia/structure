<?php

declare(strict_types=1);

namespace ProSql\Schema;

use ProSql\Connection;

/**
 * Reads what a table ACTUALLY looks like right now, straight from
 * MySQL's own information_schema — the other half of what SchemaDiffer
 * compares an EntityDefinition against. Always queries live (no
 * caching): a build run is expected to reflect the database's current
 * state exactly, not a snapshot from an earlier request.
 */
final class SchemaInspector
{
    public function __construct(private readonly Connection $connection)
    {
    }

    public function tableExists(string $table): bool
    {
        $rows = $this->connection->select(
            'SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ? LIMIT 1',
            [$this->connection->database(), $table],
        );

        return $rows !== [];
    }

    /**
     * @return array<string, array{sqlType: string, nullable: bool}>|null
     *         keyed by column name; null if the table doesn't exist at all
     */
    public function columns(string $table): ?array
    {
        if (!$this->tableExists($table)) {
            return null;
        }

        $rows = $this->connection->select(
            'SELECT column_name, column_type, is_nullable FROM information_schema.columns '
                . 'WHERE table_schema = ? AND table_name = ? ORDER BY ordinal_position',
            [$this->connection->database(), $table],
        );

        $columns = [];

        foreach ($rows as $row) {
            // information_schema always hands back its result columns
            // as COLUMN_NAME/COLUMN_TYPE/IS_NULLABLE (uppercase) —
            // that's MySQL's own fixed casing for this particular
            // system view, regardless of how the SELECT list above is
            // written. Confirmed against a real server, not assumed:
            // lowercase here silently produced an empty-looking $row
            // (undefined-index warnings, not a query failure), which
            // made every column look "missing" to SchemaDiffer and
            // caused ADD COLUMN to be attempted on columns that already
            // existed.
            //
            // column_type (e.g. "int unsigned", "varchar(255)") is
            // MySQL's own canonical rendering of a column's type — the
            // same shape SchemaDiffer normalizes ColumnDefinition::$sqlType
            // into before comparing, so the two sides speak the same format.
            $columns[$row['COLUMN_NAME']] = [
                'sqlType' => $row['COLUMN_TYPE'],
                'nullable' => $row['IS_NULLABLE'] === 'YES',
            ];
        }

        return $columns;
    }
}
