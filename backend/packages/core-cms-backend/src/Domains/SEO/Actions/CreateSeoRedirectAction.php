<?php

namespace TuranFurkan\CoreCms\Domains\SEO\Actions;

use TuranFurkan\CoreCms\Domains\SEO\DTOs\SeoRedirectData;
use TuranFurkan\CoreCms\Domains\SEO\Models\SeoRedirect;

class CreateSeoRedirectAction
{
    public function execute(SeoRedirectData $dto): SeoRedirect
    {
        return SeoRedirect::create([
            'source_path' => $dto->sourcePath,
            'target_path' => $dto->targetPath,
            'status_code' => $dto->statusCode,
            'is_active' => $dto->isActive,
        ]);
    }
}
