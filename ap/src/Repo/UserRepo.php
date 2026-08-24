<?php

declare(strict_types=1);

namespace App\Repo;

use App\Entities\UserEntity;
use ProSql\ProRepo;


/** @extends ProRepo<UserEntity> */
class UserRepo extends ProRepo
{
    // The one thing this repo declares — ProRepo derives both the table
    // name (from UserEntity's #[ProEntity('users')]) and, for its uuid
    // primary key, how to generate one (from #[Primary('uuid', ...)])
    // straight from this, so neither is ever redeclared (or able to
    // drift out of sync with the entity) here.
    protected string $entityClass = UserEntity::class;

    /** Used by UserService::authenticate() to look a user up by mail before checking their password. */
    public function findByMail(string $mail): ?array
    {
        return $this->query()->where('mail', '=', $mail)->first();
    }
}
