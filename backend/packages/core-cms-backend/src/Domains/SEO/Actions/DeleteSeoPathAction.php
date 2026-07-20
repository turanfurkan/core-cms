<?php

namespace TuranFurkan\CoreCms\Domains\SEO\Actions;

use TuranFurkan\CoreCms\Domains\SEO\Models\SeoPath;

class DeleteSeoPathAction
{
    public function execute(SeoPath $seoPath): void
    {
        $seoPath->delete();
    }
}
