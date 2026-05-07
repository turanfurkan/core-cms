<?php

namespace App\Domains\User\Listeners;

use App\Domains\User\Events\UserRegistered;
use App\Domains\User\Models\User;
use App\Domains\User\Support\AuditMasker;

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
