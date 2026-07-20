<?php

namespace TuranFurkan\CoreCms\Domains\Communication\Actions;

use TuranFurkan\CoreCms\Domains\Communication\Models\Subscriber;

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
