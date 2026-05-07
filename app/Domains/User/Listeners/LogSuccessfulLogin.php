<?php

namespace App\Domains\User\Listeners;

use App\Domains\User\Events\UserLoggedIn;

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
