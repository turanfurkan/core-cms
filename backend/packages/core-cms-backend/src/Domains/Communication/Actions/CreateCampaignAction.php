<?php

namespace TuranFurkan\CoreCms\Domains\Communication\Actions;

use TuranFurkan\CoreCms\Domains\Communication\DTOs\CampaignData;
use TuranFurkan\CoreCms\Domains\Communication\Models\Campaign;

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
