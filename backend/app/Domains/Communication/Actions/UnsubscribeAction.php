<?php

namespace App\Domains\Communication\Actions;

use App\Domains\Communication\Models\Subscriber;

class UnsubscribeAction
{
    public function execute(Subscriber $subscriber): Subscriber
    {
        $subscriber->update([
            'status' => 'unsubscribed',
            'unsubscribed_at' => now(),
        ]);

        return $subscriber;
    }
}
