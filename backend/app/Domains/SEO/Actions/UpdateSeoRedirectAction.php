<?php

namespace App\Domains\SEO\Actions;

use App\Domains\SEO\DTOs\SeoRedirectData;
use App\Domains\SEO\Models\SeoRedirect;

class UpdateSeoRedirectAction
{
    public function execute(SeoRedirect $seoRedirect, SeoRedirectData $dto): SeoRedirect
    {
        $seoRedirect->update([
            'source_path' => $dto->sourcePath,
            'target_path' => $dto->targetPath,
            'status_code' => $dto->statusCode,
            'is_active' => $dto->isActive,
        ]);

        return $seoRedirect->fresh();
    }
}
