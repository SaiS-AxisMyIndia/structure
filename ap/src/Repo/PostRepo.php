<?php

declare(strict_types=1);

namespace App\Repo;

use App\Entities\PostEntity;
use ProSql\ProRepo;

/** @extends ProRepo<PostEntity> */
class PostRepo extends ProRepo
{
    protected string $entityClass = PostEntity::class;

    /**
     * The actual "complex join" this whole entity exists to demonstrate:
     * every post together with its author's name/mail, via a real
     * `JOIN users ON posts.userId = users.id` — not two separate
     * queries stitched together in PHP. `select()` pulls columns from
     * BOTH sides of the join (aliasing the author's own `id`/`name` so
     * they don't collide with the post's own), and `orderBy()` composes
     * on top of that exactly like it would on a single-table query — a
     * join here is just another QueryBuilder call, not a special case.
     *
     * @return list<array{id: string, text: string, createdAt: string, authorId: string, authorName: string, authorMail: string}>
     */
    public function allWithAuthor(): array
    {
        return $this->query()
            ->select(
                'posts.id',
                'posts.text',
                'posts.createdAt',
                'users.id AS authorId',
                'users.name AS authorName',
                'users.mail AS authorMail',
            )
            ->join('users', 'posts.userId', '=', 'users.id')
            ->orderBy('posts.createdAt', 'DESC')
            ->get();
    }

    /** Every post by one author — no join needed, just a plain WHERE on the foreign key column. */
    public function allByUserId(string $userId): array
    {
        return $this->query()->where('userId', '=', $userId)->orderBy('createdAt', 'DESC')->get();
    }
}
