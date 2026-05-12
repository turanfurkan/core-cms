<?php

namespace App\Domains\User\Actions;

use Illuminate\Support\Facades\Password;
use Exception;

class SendPasswordResetLinkAction
{
    /**
     * Sends a password reset link to the given email.
     *
     * @param string $email
     * @return string
     * @throws Exception
     */
    public function execute(string $email): string
    {
        $status = Password::broker()->sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw new Exception(__($status));
        }

        return __($status);
    }
}
