<?php

namespace App\Domains\SEO\Actions;

use App\Domains\SEO\DTOs\SeoPathData;
use App\Domains\SEO\Models\SeoPath;

class UpdateSeoPathAction
{
    public function execute(SeoPath $seoPath, SeoPathData $dto): SeoPath
    {
        $seoPath->update([
            'path' => $dto->path,
            'meta_title' => $dto->metaTitle,
            'meta_description' => $dto->metaDescription,
            'meta_keywords' => $dto->metaKeywords,
            'og_title' => $dto->ogTitle,
            'og_description' => $dto->ogDescription,
            'og_image_id' => $dto->ogImageId,
            'canonical_url' => $dto->canonicalUrl,
            'meta_robots' => $dto->metaRobots,
        ]);

        return $seoPath->fresh();
    }
}
