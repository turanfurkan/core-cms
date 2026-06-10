<?php

namespace App\Domains\Identity\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserLoggedOut
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $userId,
        public string $scope,
        public ?string $ip = null,
        public ?string $userAgent = null,
        public ?string $reason = null,
        public ?int $revokedBy = null,
    ) {
    }
}
