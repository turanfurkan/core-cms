<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Models\User;

class UpdateUserStatusAction
{
    /**
     * Updates the user's status and revokes sessions if status is not active.
     *
     * @param User $user
     * @param string $status
     * @return User
     */
    public function execute(User $user, string $status): User
    {
        $user->update(['status' => $status]);

        // P0 SECURITY: If status is blocked or suspended, logout from all devices
        if ($status !== User::STATUS_ACTIVE) {
            $user->tokens()->delete();
        }

        return $user;
    }
}
