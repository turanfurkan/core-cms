<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Listeners;

use TuranFurkan\CoreCms\Domains\Identity\Events\UserLoggedOut;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;

class LogLogoutActivity
{
    public function handle(UserLoggedOut $event): void
    {
        $user = User::find($event->userId);
        $causer = $event->revokedBy ? User::find($event->revokedBy) : $user;

        $logger = activity('user.auth')
            ->performedOn($user)
            ->causedBy($causer)
            ->withProperties([
                'scope' => $event->scope,
                'ip' => $event->ip,
                'user_agent' => $event->userAgent,
                'reason' => $event->reason,
                'is_revoke' => (bool) $event->revokedBy,
            ]);

        $description = $event->revokedBy 
            ? "Oturumlar yönetici tarafından sonlandırıldı ({$event->scope})"
            : "Kullanıcı çıkış yaptı ({$event->scope})";

        $logger->log($description);
    }
}
