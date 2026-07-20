<?php

namespace TuranFurkan\CoreCms\Domains\SEO\DTOs;

use Illuminate\Http\Request;

final class SeoPathData
{
    public function __construct(
        public readonly string $path,
        public readonly ?array $metaTitle = null,
        public readonly ?array $metaDescription = null,
        public readonly ?array $metaKeywords = null,
        public readonly ?array $ogTitle = null,
        public readonly ?array $ogDescription = null,
        public readonly ?int $ogImageId = null,
        public readonly ?string $canonicalUrl = null,
        public readonly ?string $metaRobots = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            path: (string) $request->input('path'),
            metaTitle: is_array($request->input('meta_title')) ? $request->input('meta_title') : null,
            metaDescription: is_array($request->input('meta_description')) ? $request->input('meta_description') : null,
            metaKeywords: is_array($request->input('meta_keywords')) ? $request->input('meta_keywords') : null,
            ogTitle: is_array($request->input('og_title')) ? $request->input('og_title') : null,
            ogDescription: is_array($request->input('og_description')) ? $request->input('og_description') : null,
            ogImageId: $request->filled('og_image_id') ? (int) $request->input('og_image_id') : null,
            canonicalUrl: $request->input('canonical_url'),
            metaRobots: $request->input('meta_robots'),
        );
    }
}
