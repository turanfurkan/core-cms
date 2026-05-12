<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Models\User;

class DeleteAccountAction
{
    /**
     * Revokes all sessions and soft-deletes the user account.
     *
     * @param User $user
     * @return void
     */
    public function execute(User $user): void
    {
        // Logout from all devices
        $user->tokens()->delete();

        // Perform soft delete
        $user->delete();
    }
}
