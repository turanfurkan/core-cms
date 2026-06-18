<?php

namespace App\Domains\Communication\Actions;

use App\Domains\Communication\DTOs\SubscriberData;
use App\Domains\Communication\Models\Subscriber;

class SubscribeAction
{
    public function execute(SubscriberData $dto): Subscriber
    {
        $subscriber = null;

        if ($dto->email) {
            $subscriber = Subscriber::where('email', $dto->email)->first();
        }

        if (!$subscriber && $dto->phone) {
            $subscriber = Subscriber::where('phone', $dto->phone)->first();
        }

        if ($subscriber) {
            $subscriber->update([
                'email' => $dto->email ?? $subscriber->email,
                'phone' => $dto->phone ?? $subscriber->phone,
                'status' => 'active',
                'unsubscribed_at' => null,
                'ip_address' => $dto->ipAddress,
                'consent_given' => $dto->consentGiven,
            ]);
        } else {
            $subscriber = Subscriber::create([
                'email' => $dto->email,
                'phone' => $dto->phone,
                'status' => 'active',
                'ip_address' => $dto->ipAddress,
                'consent_given' => $dto->consentGiven,
            ]);
        }

        return $subscriber;
    }
}
