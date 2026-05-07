<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Models\User;

class CreateAuthTokenAction
{
    public const DEFAULT_NAME = 'auth';

    public function execute(User $user, string $name = self::DEFAULT_NAME): string
    {
        return $user->createToken($name)->plainTextToken;
    }
}
