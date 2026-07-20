<?php

namespace TuranFurkan\CoreCms\Domains\Media\DTOs;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

final class UploadMediaData
{
    public function __construct(
        public readonly UploadedFile $file,
        public readonly ?int $folderId = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            file: $request->file('file'),
            folderId: $request->input('folder_id') ? (int) $request->input('folder_id') : null,
        );
    }
}
