<?php

namespace App\Domains\Identity\Listeners;

use App\Domains\Identity\Events\UserRegistered;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Support\AuditMasker;

class LogRegisteredUser
{
    public function handle(UserRegistered $event): void
    {
        $causer = $event->createdBy !== null
            ? User::query()->find($event->createdBy)
            : $event->user;

        activity('user.register')
            ->causedBy($causer)
            ->performedOn($event->user)
            ->withProperties([
                'register_channel' => $event->registerChannel,
                'created_by' => $event->createdBy,
                'phone_masked' => AuditMasker::maskPhone($event->user->phone),
                'email_masked' => AuditMasker::maskEmail($event->user->email),
            ])
            ->log('user.registered');
    }
}
