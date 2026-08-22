<?php

declare(strict_types=1);

namespace App\Repo;

use ProSql\ProRepo;


class UserRepo extends ProRepo
{
    protected string $table = 'users';

    /** Used by UserService::authenticate() to look a user up by mail before checking their password. */
    public function findByMail(string $mail): ?array
    {
        return $this->query()->where('mail', '=', $mail)->first();
    }
}
