<?php

declare(strict_types=1);

namespace ProSql\Schema;

/**
 * What one SchemaBuilder::build() run did — everything ProSqlModule's
 * `gg build` hook needs to print a summary, without it having to know
 * any of SchemaBuilder's internals.
 */
final class BuildReport
{
    /** @param list<string> $errors one "ClassName: message" entry per entity that failed to scan/diff/apply — the rest still ran */
    public function __construct(
        public readonly int $tablesCreated = 0,
        public readonly int $columnsAdded = 0,
        public readonly int $foreignKeysAdded = 0,
        /** A plain, non-unique #[Enum(index: true)] index — inlined for free at CREATE TABLE time, so only retrofits onto an existing table count here. */
        public readonly int $indexesAdded = 0,
        public readonly int $complexChangesDeferred = 0,
        /** Statements run from a #[Migration] attribute — see Attributes\Migration's own docblock. */
        public readonly int $rawStatementsRun = 0,
        public readonly ?string $migrationFile = null,
        public readonly array $errors = [],
    ) {
    }
}
