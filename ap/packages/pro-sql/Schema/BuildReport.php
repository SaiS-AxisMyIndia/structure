<?php

declare(strict_types=1);

namespace ProSql\Schema;

/**
 * What one SchemaBuilder::build() run did — everything ProSqlModule's
 * `apc build` hook needs to print a summary, without it having to know
 * any of SchemaBuilder's internals.
 */
final class BuildReport
{
    /** @param list<string> $errors one "ClassName: message" entry per entity that failed to scan/diff/apply — the rest still ran */
    public function __construct(
        public readonly int $tablesCreated = 0,
        public readonly int $columnsAdded = 0,
        public readonly int $foreignKeysAdded = 0,
        public readonly int $complexChangesDeferred = 0,
        public readonly ?string $migrationFile = null,
        public readonly array $errors = [],
    ) {
    }
}
