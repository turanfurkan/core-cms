<?php

namespace TuranFurkan\CoreCms\Domains\Communication\Actions;

use TuranFurkan\CoreCms\Domains\Communication\Jobs\SendCampaignJob;
use TuranFurkan\CoreCms\Domains\Communication\Models\Campaign;

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
