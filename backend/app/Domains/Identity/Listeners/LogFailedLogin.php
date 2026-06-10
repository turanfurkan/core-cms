<?php

namespace App\Domains\Identity\Listeners;

use App\Domains\Identity\Events\UserLoginFailed;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Support\AuditMasker;

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
