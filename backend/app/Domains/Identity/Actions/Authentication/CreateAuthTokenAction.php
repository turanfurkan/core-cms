<?php

namespace App\Domains\Identity\Actions\Authentication;

use App\Domains\Identity\Models\User;

class CreateAuthTokenAction
{
    public const DEFAULT_NAME = 'auth';

    public function execute(User $user, string $name = self::DEFAULT_NAME): string
    {
        return $user->createToken($name)->plainTextToken;
    }
}
