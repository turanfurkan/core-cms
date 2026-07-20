<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Listeners;

use TuranFurkan\CoreCms\Domains\Identity\Events\UserLoginFailed;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Identity\Support\AuditMasker;

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
