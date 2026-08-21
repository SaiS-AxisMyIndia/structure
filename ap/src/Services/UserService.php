<?php

declare(strict_types=1);

namespace App\Services;

use ApiPro\Attributes\Service;

#[Service]
class UserService
{
    /**
     * @var array<int, array{id: int, name: string, mail: string, password: string}>
     */
    private array $users = [
        1 => ['id' => 1, 'name' => 'Sai Subramanyam', 'mail' => 'sai@apipro.com', 'password' => 'secret123'],
        2 => ['id' => 2, 'name' => 'Paradigm IT', 'mail' => 'admin@apipro.com', 'password' => 'secret123'],
    ];

    /** @return list<array{id: int, name: string, mail: string}> */
    public function all(): array
    {
        return array_map($this->withoutPassword(...), array_values($this->users));
    }

    /** @return array{id: int, name: string, mail: string}|null */
    public function find(int $id): ?array
    {
        $user = $this->users[$id] ?? null;

        return $user !== null ? $this->withoutPassword($user) : null;
    }

    /**
     * Demo-only credential check — plaintext comparison via hash_equals()
     * (timing-safe, but still plaintext; a real app hashes passwords with
     * password_hash()/password_verify(), never stores or compares them
     * raw like this). Returns the matching user (without its password)
     * on success, null on any mismatch.
     *
     * @return array{id: int, name: string, mail: string}|null
     */
    public function authenticate(string $mail, string $password): ?array
    {
        foreach ($this->users as $user) {
            if ($user['mail'] === $mail && hash_equals($user['password'], $password)) {
                return $this->withoutPassword($user);
            }
        }

        return null;
    }

    /** @param array{id: int, name: string, mail: string, password: string} $user */
    private function withoutPassword(array $user): array
    {
        unset($user['password']);

        return $user;
    }
}
