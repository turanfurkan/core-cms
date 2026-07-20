<?php

namespace TuranFurkan\CoreCms\Domains\Race\Actions;

use TuranFurkan\CoreCms\Domains\Race\Models\Race;
use Illuminate\Support\Facades\DB;

class UpdateRaceAction
{
    public function execute(Race $race, array $data): Race
    {
        return DB::transaction(function () use ($race, $data) {
            $categoryIds = $data['category_ids'] ?? [];
            $childRaceIds = $data['child_race_ids'] ?? [];

            // Update the race parameters
            $race->update($data);

            // Sync categories polymorphically
            $race->categories()->sync($categoryIds);

            // Sync child races if multi-race package
            if ($race->is_multi_race) {
                $race->childRaces()->sync($childRaceIds);
            } else {
                $race->childRaces()->detach();
            }

            return $race;
        });
    }
}
