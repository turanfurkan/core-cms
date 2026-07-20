<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;

class CreateAuthTokenAction
{
    public const DEFAULT_NAME = 'auth';

    public function execute(User $user, string $name = self::DEFAULT_NAME): string
    {
        return $user->createToken($name)->plainTextToken;
    }
}
