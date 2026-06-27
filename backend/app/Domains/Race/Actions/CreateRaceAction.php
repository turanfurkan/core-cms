<?php

namespace App\Domains\Race\Actions;

use App\Domains\Race\Models\Race;
use Illuminate\Support\Facades\DB;

class CreateRaceAction
{
    public function execute(array $data): Race
    {
        return DB::transaction(function () use ($data) {
            $categoryIds = $data['category_ids'] ?? [];
            $childRaceIds = $data['child_race_ids'] ?? [];

            // Create the race instance
            $race = Race::create($data);

            // Sync categories polymorphically
            $race->categories()->sync($categoryIds);

            // Sync child races if multi-race package
            if ($race->is_multi_race) {
                $race->childRaces()->sync($childRaceIds);
            }

            return $race;
        });
    }
}
