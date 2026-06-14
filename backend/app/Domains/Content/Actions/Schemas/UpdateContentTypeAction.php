<?php

namespace App\Domains\Content\Actions\Schemas;

use App\Domains\Content\DTOs\ContentTypeData;
use App\Domains\Content\Models\ContentType;

class UpdateContentTypeAction
{
    public function execute(ContentType $contentType, ContentTypeData $data): ContentType
    {
        $contentType->update([
            'name' => $data->name,
            'slug' => $data->slug,
            'description' => $data->description,
            'is_collection' => $data->is_collection,
        ]);

        return $contentType;
    }
}
