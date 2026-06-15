<?php

namespace App\Domains\SEO\Actions;

use App\Domains\SEO\Models\SeoPath;

class DeleteSeoPathAction
{
    public function execute(SeoPath $seoPath): void
    {
        $seoPath->delete();
    }
}
