<?php

declare(strict_types=1);

namespace App\Entities;

use ProSql\Attributes\Primary;
use ProSql\Attributes\ProEntity;
use ProSql\Attributes\Timestamp;


#[ProEntity('users')]
class UserEntity
{
    #[Primary('int')]
    public int $id;

    public string $name;

    public string $mail;
     
    public string $password;

    #[Timestamp(current: true)]
    public string $createdAt;

    #[Timestamp(current: true, update: true)]
    public string $updatedAt;
}
