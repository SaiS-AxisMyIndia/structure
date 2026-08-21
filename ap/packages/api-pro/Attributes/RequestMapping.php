<?php

declare(strict_types=1);

namespace ApiPro\Attributes;

use Attribute;

/**
 * Base HTTP route mapping, equivalent to Spring's @RequestMapping.
 * GetMapping/PostMapping/PutMapping/DeleteMapping extend this with a fixed
 * method, mirroring Spring's dedicated shortcut annotations.
 */
#[Attribute(Attribute::TARGET_METHOD)]
class RequestMapping
{
    public function __construct(
        public string $path = '',
        public string $method = 'GET',
    ) {
    }
}
