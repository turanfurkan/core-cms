<?php

namespace App\Domains\Identity\Actions\Users;

use App\Domains\Identity\Models\User;

class SyncUserRolesAction
{
    /**
     * Synchronizes user roles using Spatie Permission.
     *
     * @param User $user
     * @param array $roles
     * @return User
     */
    public function execute(User $user, array $roles): User
    {
        $user->syncRoles($roles);

        return $user;
    }
}
