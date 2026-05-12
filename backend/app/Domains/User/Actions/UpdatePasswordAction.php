<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Models\User;
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
