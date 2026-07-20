<?php

namespace TuranFurkan\CoreCms\Domains\SEO\DTOs;

use Illuminate\Http\Request;

final class SeoRedirectData
{
    public function __construct(
        public readonly string $sourcePath,
        public readonly string $targetPath,
        public readonly int $statusCode = 301,
        public readonly bool $isActive = true,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            sourcePath: (string) $request->input('source_path'),
            targetPath: (string) $request->input('target_path'),
            statusCode: (int) $request->input('status_code', 301),
            isActive: $request->has('is_active') ? (bool) $request->input('is_active') : true,
        );
    }
}
