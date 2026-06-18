<?php

namespace App\Domains\Communication\Actions;

use App\Domains\Communication\Jobs\SendCampaignJob;
use App\Domains\Communication\Models\Campaign;

class SendCampaignAction
{
    public function execute(Campaign $campaign): Campaign
    {
        $campaign->update([
            'status' => 'sending',
        ]);

        // Dispatch the send campaign job
        SendCampaignJob::dispatch($campaign);

        return $campaign;
    }
}
