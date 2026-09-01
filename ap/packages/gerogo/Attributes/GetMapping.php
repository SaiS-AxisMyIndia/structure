<?php

declare(strict_types=1);

namespace Gerogo\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD)]
class GetMapping extends RequestMapping
{
    public function __construct(string $path = '')
    {
        parent::__construct($path, 'GET');
    }
}
