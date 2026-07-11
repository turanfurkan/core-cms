<?php

namespace App\Domains\Page\Actions;

use App\Domains\Page\Models\Page;
use Illuminate\Support\Facades\DB;

class CreatePageAction
{
    public function execute(array $data): Page
    {
        return DB::transaction(function () use ($data) {
            $data['created_by'] = auth()->id();
            return Page::create($data);
        });
    }
}
