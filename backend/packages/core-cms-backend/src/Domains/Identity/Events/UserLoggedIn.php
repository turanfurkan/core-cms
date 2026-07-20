<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Events;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserLoggedIn
{
    use Dispatchable, SerializesModels;

    public const METHOD_PASSWORD = 'password';
    public const METHOD_OTP = 'otp';

    public function __construct(
        public User $user,
        public string $loginMethod = self::METHOD_PASSWORD,
        public ?string $ip = null,
        public ?string $userAgent = null,
    ) {
    }
}
