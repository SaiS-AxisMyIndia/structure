<?php

declare(strict_types=1);

namespace App\Services;

/**
 * In-memory demo data for HomeController/HomePage — same limitation as
 * UserService: this resets every request (no persistent process, no real
 * storage backing it), so a post added via the page's form is visible
 * immediately (the POST response hands it straight back to the page's
 * own JS), but won't survive a reload. Swap this for a real
 * ProSql\Repository once you want posts to actually persist.
 */
class PostService
{
    /** @var array<int, array{id: int, text: string, createdAt: string}> */
    private array $posts = [
        1 => ['id' => 1, 'text' => 'Welcome to api-pro.', 'createdAt' => '2026-01-01T00:00:00+00:00'],
    ];

    private int $nextId = 2;

    /** @return list<array{id: int, text: string, createdAt: string}> */
    public function all(): array
    {
        return array_values($this->posts);
    }

    /** @return array{id: int, text: string, createdAt: string} */
    public function create(string $text): array
    {
        $post = ['id' => $this->nextId, 'text' => $text, 'createdAt' => date(DATE_ATOM)];
        $this->posts[$this->nextId] = $post;
        $this->nextId++;

        return $post;
    }
}
