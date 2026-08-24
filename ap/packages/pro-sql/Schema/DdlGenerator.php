<?php

declare(strict_types=1);

namespace ProSql\Schema;

/**
 * Turns an EntityDefinition/ColumnDefinition into the actual SQL
 * SchemaBuilder either executes or writes into the migration script —
 * pure string building, no database access here at all.
 */
final class DdlGenerator
{
    /**
     * @param list<string> $includeForeignKeysFor column names whose FK
     *        constraint should be inlined into the CREATE TABLE itself —
     *        SchemaBuilder only includes a column here once it's checked
     *        (via SchemaInspector) that the referenced table already
     *        exists; everything else is deferred instead (see
     *        SchemaBuilder's docblock on why cross-entity FK ordering is
     *        a known v1 limitation).
     */
    public function createTable(EntityDefinition $entity, array $includeForeignKeysFor = []): string
    {
        $lines = array_map($this->columnSql(...), $entity->columns);
        $lines[] = "  PRIMARY KEY (`{$entity->primaryColumn()->name}`)";

        foreach ($entity->columns as $column) {
            if ($column->references !== null && in_array($column->name, $includeForeignKeysFor, true)) {
                $lines[] = '  ' . $this->foreignKeyClause($entity->table, $column);
            }
        }

        foreach ($entity->uniqueGroups as $group) {
            $lines[] = '  ' . $this->uniqueKeyClause($entity->table, $group);
        }

        return "CREATE TABLE `{$entity->table}` (\n" . implode(",\n", $lines) . "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    }

    public function addColumn(string $table, ColumnDefinition $column): string
    {
        return "ALTER TABLE `{$table}` ADD COLUMN " . trim($this->columnSql($column)) . ';';
    }

    public function modifyColumn(string $table, ColumnDefinition $column): string
    {
        return "ALTER TABLE `{$table}` MODIFY COLUMN " . trim($this->columnSql($column)) . ';';
    }

    /** A standalone ALTER for a foreign key SchemaBuilder is adding onto an already-existing table (as opposed to one inlined at CREATE TABLE time). */
    public function addForeignKey(string $table, ColumnDefinition $column): string
    {
        return "ALTER TABLE `{$table}` ADD " . $this->foreignKeyClause($table, $column) . ';';
    }

    /**
     * A standalone ALTER for a #[UniqueMap] composite constraint onto an
     * already-existing table. Not currently called by SchemaBuilder for
     * an existing table (retrofitting one onto columns that may already
     * hold duplicate combinations is exactly the kind of "complex"
     * change that needs a human to check first) — it exists so a
     * migration script reviewer has the real statement to run once
     * they've confirmed the data supports it, not just a description of
     * what's missing.
     *
     * @param list<string> $columns 2+ column names, from EntityDefinition::$uniqueGroups
     */
    public function addUniqueKey(string $table, array $columns): string
    {
        return "ALTER TABLE `{$table}` ADD " . $this->uniqueKeyClause($table, $columns) . ';';
    }

    private function columnSql(ColumnDefinition $column): string
    {
        $sql = "  `{$column->name}` {$column->sqlType}";
        $sql .= $column->nullable ? ' NULL' : ' NOT NULL';

        if ($column->defaultCurrentTimestamp) {
            $sql .= ' DEFAULT CURRENT_TIMESTAMP';
        }

        if ($column->uuidVersion !== null) {
            $sql .= ' DEFAULT (' . self::uuidDefaultExpression($column->uuidVersion) . ')';
        }

        if ($column->onUpdateCurrentTimestamp) {
            $sql .= ' ON UPDATE CURRENT_TIMESTAMP';
        }

        if ($column->autoIncrement) {
            $sql .= ' AUTO_INCREMENT';
        }

        // Never for the primary column — PRIMARY KEY already implies
        // uniqueness, so a redundant UNIQUE here would just be noise
        // (still valid SQL, just pointless) — see EntityScanner's own
        // note on why $unique is threaded through primary columns
        // anyway rather than silently dropped.
        if ($column->unique && !$column->primary) {
            $sql .= ' UNIQUE';
        }

        return $sql;
    }

    /** @param ColumnDefinition $column must have $column->references !== null */
    private function foreignKeyClause(string $table, ColumnDefinition $column): string
    {
        $name = "fk_{$table}_{$column->name}";

        return "CONSTRAINT `{$name}` FOREIGN KEY (`{$column->name}`) REFERENCES `{$column->references['table']}` (`{$column->references['column']}`)";
    }

    /** @param list<string> $columns */
    private function uniqueKeyClause(string $table, array $columns): string
    {
        $name = 'uniq_' . $table . '_' . implode('_', $columns);
        $quoted = implode(', ', array_map(static fn (string $c): string => "`$c`", $columns));

        return "UNIQUE KEY `{$name}` ({$quoted})";
    }

    /**
     * The MySQL 8.0.13+ expression this uuid #[Primary]'s version
     * builds into `DEFAULT (...)` — a pure backstop (see
     * ColumnDefinition::$uuidVersion's own comment), so it never has to
     * match ProRepo::newPrimaryKey()/ProSql\Uuid byte-for-byte, only
     * produce a correctly-shaped RFC 4122 UUID of that version.
     *
     * version 4 (random): each field comes from an independent
     * RANDOM_BYTES() call — fine, since a v4 UUID has no internal
     * relationship between its fields to preserve, only fixed version
     * (`4`) / variant (`10xx`) nibbles.
     *
     * version 6 (time-ordered): unlike version 4, this DOES need one
     * consistent 60-bit "timestamp" value split across three output
     * groups — but MySQL's own UUID() generates a fresh value on EVERY
     * call (even textually repeated ones in the same expression), so it
     * can't be used here. NOW(6) is used instead specifically because
     * MySQL fixes it to one value for an entire statement — repeating
     * that same sub-expression 3 times below reliably yields the exact
     * same microsecond count each time, which is what makes the split
     * internally consistent (and, across separate statements/rows,
     * genuinely time-ordered — the whole point of v6 over v4).
     */
    private static function uuidDefaultExpression(int $version): string
    {
        if ($version === 4) {
            return "lower(concat("
                . "hex(random_bytes(4)), '-', "
                . "hex(random_bytes(2)), '-4', "
                . "substr(hex(random_bytes(2)), 2, 3), '-', "
                . "hex(floor(ascii(random_bytes(1)) / 64) + 8), substr(hex(random_bytes(2)), 2, 3), '-', "
                . "hex(random_bytes(6))"
                . "))";
        }

        // "the low 15 hex digits (60 bits) of the current microsecond-
        // since-epoch count, zero-padded" — repeated 3 times, once per
        // slice, since a DEFAULT expression can't name an intermediate
        // value the way a variable would.
        $micros = "substr(lpad(hex(floor(unix_timestamp(now(6)) * 1000000)), 16, '0'), 2, 15)";

        return "lower(concat("
            . "substr({$micros}, 1, 8), '-', "
            . "substr({$micros}, 9, 4), '-', "
            . "'6', substr({$micros}, 13, 3), '-', "
            . "hex(floor(ascii(random_bytes(1)) / 64) + 8), substr(hex(random_bytes(2)), 2, 3), '-', "
            . "hex(random_bytes(6))"
            . "))";
    }
}
