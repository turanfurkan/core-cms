<?php

namespace TuranFurkan\CoreCms\Domains\SEO\Actions;

use TuranFurkan\CoreCms\Domains\SEO\Models\SeoRedirect;

class DeleteSeoRedirectAction
{
    public function execute(SeoRedirect $seoRedirect): void
    {
        $seoRedirect->delete();
    }
}
