<?php

namespace App\Domains\SEO\Traits;

use App\Domains\SEO\Models\SeoMetadata;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait HasSeo
{
    public function seo(): MorphOne
    {
        return $this->morphOne(SeoMetadata::class, 'seoable');
    }

    public function updateSeo(array $seoData): SeoMetadata
    {
        return $this->seo()->updateOrCreate(
            [],
            [
                'meta_title' => $seoData['meta_title'] ?? null,
                'meta_description' => $seoData['meta_description'] ?? null,
                'meta_keywords' => $seoData['meta_keywords'] ?? null,
                'og_title' => $seoData['og_title'] ?? null,
                'og_description' => $seoData['og_description'] ?? null,
                'og_image_id' => $seoData['og_image_id'] ?? null,
                'canonical_url' => $seoData['canonical_url'] ?? null,
                'meta_robots' => $seoData['meta_robots'] ?? null,
            ]
        );
    }
}
