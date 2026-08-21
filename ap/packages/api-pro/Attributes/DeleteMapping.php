<?php

declare(strict_types=1);

namespace ApiPro\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD)]
class DeleteMapping extends RequestMapping
{
    public function __construct(string $path = '')
    {
        parent::__construct($path, 'DELETE');
    }
}
