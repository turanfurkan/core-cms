<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Models\User;

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
