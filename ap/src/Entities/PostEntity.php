<?php

declare(strict_types=1);

namespace App\Entities;

use ProSql\Attributes\Link;
use ProSql\Attributes\Primary;
use ProSql\Attributes\ProEntity;
use ProSql\Attributes\Timestamp;

// A real, persisted post — the join target for PostRepo::allWithAuthor()
// (see its own docblock). Not to be confused with App\Services\PostService,
// which is HomeController's own in-memory demo data backing the homepage's
// "Live demo" widget — deliberately left untouched; this is a separate,
// genuinely-persisted table.
#[ProEntity('posts')]
class PostEntity
{
    #[Primary('uuid')]
    public string $id;

    /** Which `users` row wrote this post — the actual foreign key PostRepo::allWithAuthor() joins on. */
    #[Link('users.id')]
    public string $userId;

    public string $text;

    #[Timestamp(current: true)]
    public string $createdAt;

    #[Timestamp(current: true, update: true)]
    public string $updatedAt;
}
