<?php

namespace App\Domains\SEO\Actions;

use App\Domains\SEO\Models\SeoRedirect;

class DeleteSeoRedirectAction
{
    public function execute(SeoRedirect $seoRedirect): void
    {
        $seoRedirect->delete();
    }
}
