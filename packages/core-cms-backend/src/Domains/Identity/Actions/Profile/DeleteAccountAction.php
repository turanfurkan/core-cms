<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Profile;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;

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
