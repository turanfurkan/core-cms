<?php

namespace App\Domains\Identity\Actions\Profile;

use App\Domains\Identity\Models\User;
use Illuminate\Support\Facades\Hash;

class UpdatePasswordAction
{
    /**
     * Updates the user's password and optionally revokes other sessions.
     *
     * @param User $user
     * @param string $newPassword
     * @param bool $logoutOthers
     * @return void
     */
    public function execute(User $user, string $newPassword, bool $logoutOthers = true): void
    {
        $user->update([
            'password' => Hash::make($newPassword)
        ]);

        if ($logoutOthers) {
            // Revoke all tokens except the current one
            $user->tokens()
                ->where('id', '!=', $user->currentAccessToken()?->id)
                ->delete();
        }
    }
}
