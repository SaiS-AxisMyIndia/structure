<?php

declare(strict_types=1);

namespace ProSql\Exceptions;

use RuntimeException;
use Throwable;

class QueryException extends RuntimeException
{
    /** @param array<int|string, mixed> $bindings */
    public function __construct(
        string $message,
        public readonly ?string $sql = null,
        public readonly array $bindings = [],
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
