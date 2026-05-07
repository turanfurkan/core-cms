<?php

namespace App\Domains\User\Events;

use App\Domains\User\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserRegistered
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public User $user,
        public ?int $createdBy = null,
        public string $registerChannel = 'self',
    ) {
    }
}
