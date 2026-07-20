<?php

namespace TuranFurkan\CoreCms\Domains\Race\Actions;

use TuranFurkan\CoreCms\Domains\Race\Models\Race;
use Illuminate\Support\Facades\DB;

class ReorderRacesAction
{
    public function execute(array $orderedIds): void
    {
        DB::transaction(function () use ($orderedIds) {
            foreach ($orderedIds as $index => $id) {
                Race::where('id', $id)->update(['order' => $index + 1]);
            }
        });
    }
}
