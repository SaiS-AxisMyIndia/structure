<?php

declare(strict_types=1);

namespace ProSql\Attributes;

/**
 * The `ON DELETE`/`ON UPDATE` behaviors MySQL's InnoDB actually supports
 * for a foreign key — backed the same way PrimaryType is (see its own
 * docblock for why: a typo in #[Link(onDelete: 'casacde')] fails loudly
 * the moment something reflects on the attribute, not silently at
 * CREATE TABLE time as a MySQL syntax error three steps removed from the
 * entity that caused it).
 *
 * SET DEFAULT is deliberately omitted — InnoDB parses it but always
 * enforces it as RESTRICT, so allowing it here would just be a trap.
 */
enum ReferentialAction: string
{
    case Cascade = 'CASCADE';
    case SetNull = 'SET NULL';
    case Restrict = 'RESTRICT';
    case NoAction = 'NO ACTION';
}
