<?php

declare(strict_types=1);

namespace ProSql\Attributes;

/**
 * The column types #[Primary] currently understands — kept as a real
 * backed enum (not a freeform string) so a typo in #[Primary('uiid')]
 * fails loudly the moment something actually reflects on the attribute,
 * instead of silently becoming an unrecognized column type three steps
 * later inside whatever eventually consumes it (e.g. the table-diffing
 * "apc build" migration step this attribute exists for in the first
 * place — see ProEntity's docblock).
 */
enum PrimaryType: string
{
    case Int = 'int';
    case Uuid = 'uuid';
    case Bigint = 'bigint';
}
