<?php

namespace App\Domains\Identity\Listeners;

use App\Domains\Identity\Events\UserLoggedIn;

class LogSuccessfulLogin
{
    public function handle(UserLoggedIn $event): void
    {
        activity('user.login')
            ->causedBy($event->user)
            ->performedOn($event->user)
            ->withProperties([
                'login_method' => $event->loginMethod,
                'ip' => $event->ip,
                'user_agent' => $event->userAgent,
            ])
            ->log('user.login.success');
    }
}
