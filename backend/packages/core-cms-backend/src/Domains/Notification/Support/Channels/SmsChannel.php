<?php

namespace TuranFurkan\CoreCms\Domains\Notification\Support\Channels;

use Illuminate\Notifications\Notification;
use TuranFurkan\CoreCms\Domains\Identity\Contracts\SmsGateway;

class SmsChannel
{
    protected SmsGateway $smsGateway;

    public function __construct(SmsGateway $smsGateway)
    {
        $this->smsGateway = $smsGateway;
    }

    public function send($notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toSms')) {
            return;
        }

        $message = $notification->toSms($notifiable);
        if (!$message) {
            return;
        }

        $phone = $notifiable->routeNotificationFor('sms', $notification) ?: ($notifiable->phone ?? null);
        if (!$phone) {
            return;
        }

        $this->smsGateway->send($phone, $message);
    }
}
