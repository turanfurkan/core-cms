<?php

namespace App\Domains\Identity\Actions\Authentication;

use App\Domains\Identity\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Exception;

class ResetPasswordAction
{
    /**
     * Resets the user's password and revokes all active sessions.
     *
     * @param array $credentials
     * @return string
     * @throws Exception
     */
    public function execute(array $credentials): string
    {
        $status = Password::broker()->reset(
            $credentials,
            function (User $user, string $password) {
                // Update password
                $user->password = Hash::make($password);
                $user->setRememberToken(Str::random(60));
                $user->save();

                // P0 SECURITY: Revoke all active sessions (tokens)
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw new Exception(__($status));
        }

        return __($status);
    }
}
