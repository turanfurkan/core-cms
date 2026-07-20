<?php

namespace TuranFurkan\CoreCms\Domains\Page\Actions;

use TuranFurkan\CoreCms\Domains\Page\Models\Page;
use Illuminate\Support\Facades\DB;

class UpdatePageAction
{
    public function execute(Page $page, array $data): Page
    {
        return DB::transaction(function () use ($page, $data) {
            $data['updated_by'] = auth()->id();
            $page->update($data);
            return $page;
        });
    }
}
