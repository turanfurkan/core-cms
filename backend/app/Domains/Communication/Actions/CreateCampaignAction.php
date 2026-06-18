<?php

namespace App\Domains\Communication\Actions;

use App\Domains\Communication\DTOs\CampaignData;
use App\Domains\Communication\Models\Campaign;

class CreateCampaignAction
{
    public function execute(CampaignData $dto): Campaign
    {
        return Campaign::create([
            'name' => $dto->name,
            'template_code' => $dto->templateCode,
            'status' => 'draft',
            'scheduled_at' => $dto->scheduledAt,
        ]);
    }
}
