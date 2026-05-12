<?php

namespace App\Domains\User\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserLoginFailed
{
    use Dispatchable, SerializesModels;

    public const REASON_UNKNOWN_USER = 'unknown_user';
    public const REASON_INVALID_PASSWORD = 'invalid_password';
    public const REASON_ACCOUNT_LOCKED = 'account_locked';
    public const REASON_PASSWORD_LOGIN_DISABLED = 'password_login_disabled';

    public function __construct(
        public string $identifier,
        public string $reason,
        public ?string $ip = null,
        public ?string $userAgent = null,
        public ?int $userId = null,
    ) {
    }
}
