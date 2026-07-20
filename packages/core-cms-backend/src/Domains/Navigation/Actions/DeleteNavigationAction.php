<?php

namespace TuranFurkan\CoreCms\Domains\Navigation\Actions;

use TuranFurkan\CoreCms\Domains\Navigation\Models\Navigation;
use Illuminate\Support\Facades\DB;

class DeleteNavigationAction
{
    public function execute(Navigation $navigation): void
    {
        DB::transaction(function () use ($navigation) {
            $navigation->items()->delete();
            $navigation->delete();
        });
    }
}
