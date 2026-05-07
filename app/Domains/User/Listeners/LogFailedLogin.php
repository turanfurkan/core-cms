<?php

namespace App\Domains\User\Listeners;

use App\Domains\User\Events\UserLoginFailed;
use App\Domains\User\Models\User;
use App\Domains\User\Support\AuditMasker;

class LogFailedLogin
{
    public function handle(UserLoginFailed $event): void
    {
        $causer = $event->userId !== null
            ? User::query()->find($event->userId)
            : null;

        $logger = activity('user.login')->withProperties([
            'identifier_masked' => AuditMasker::maskIdentifier($event->identifier),
            'reason' => $event->reason,
            'ip' => $event->ip,
            'user_agent' => $event->userAgent,
            'user_id' => $event->userId,
        ]);

        if ($causer !== null) {
            $logger->causedBy($causer)->performedOn($causer);
        }

        $logger->log('user.login.failed');
    }
}
