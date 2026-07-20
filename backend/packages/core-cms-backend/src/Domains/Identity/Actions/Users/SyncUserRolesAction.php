<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Users;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;

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
