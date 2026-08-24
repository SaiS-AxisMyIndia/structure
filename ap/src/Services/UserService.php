<?php

declare(strict_types=1);

namespace App\Services;

use ApiPro\Attributes\Service;
use App\Repo\UserRepo;

#[Service]
class UserService
{
    public function __construct(private readonly UserRepo $userRepo)
    {
    }

    /** @return list<array{id: string, name: string, mail: string}> */
    public function all(): array
    {
        return array_map($this->withoutPassword(...), $this->userRepo->all());
    }

    /** @return array{id: string, name: string, mail: string}|null */
    public function find(string $id): ?array
    {
        $user = $this->userRepo->find($id);

        return $user !== null ? $this->withoutPassword($user) : null;
    }

    /**
     * Creates a real row in `users` (plaintext password — same demo-only
     * caveat as authenticate()'s own docblock below, and UserEntity's:
     * hash this with password_hash() before this table ever holds a
     * real user's password) and returns it without its password, or
     * null if $mail is already taken — AuthController::register() turns
     * that into a 409 rather than a duplicate row.
     *
     * @return array{id: string, name: string, mail: string}|null
     */
    public function register(string $name, string $mail, string $password): ?array
    {
        if ($this->userRepo->findByMail($mail) !== null) {
            return null;
        }

        $id = $this->userRepo->create(['name' => $name, 'mail' => $mail, 'password' => $password]);
        $user = $this->userRepo->find($id);

        return $user !== null ? $this->withoutPassword($user) : null;
    }

    /**
     * Plaintext comparison via hash_equals() (timing-safe, but still
     * plaintext; a real app hashes passwords with password_hash()/
     * password_verify() and compares with password_verify(), never
     * stores or compares them raw like this — see UserEntity's own
     * docblock on the same point). Returns the matching user (without
     * its password) on success, null on any mismatch — including "no
     * user with that mail at all", same as before.
     *
     * @return array{id: string, name: string, mail: string}|null
     */
    public function authenticate(string $mail, string $password): ?array
    {
        $user = $this->userRepo->findByMail($mail);

        if ($user === null || !hash_equals($user['password'], $password)) {
            return null;
        }

        return $this->withoutPassword($user);
    }

    /** @param array{id: string, name: string, mail: string, password: string} $user */
    private function withoutPassword(array $user): array
    {
        unset($user['password']);

        return $user;
    }
}
