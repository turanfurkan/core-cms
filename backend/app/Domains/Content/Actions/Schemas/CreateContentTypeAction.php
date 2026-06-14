<?php

namespace App\Domains\Content\Actions\Schemas;

use App\Domains\Content\DTOs\ContentTypeData;
use App\Domains\Content\Models\ContentType;

class CreateContentTypeAction
{
    public function execute(ContentTypeData $data): ContentType
    {
        return ContentType::create([
            'name' => $data->name,
            'slug' => $data->slug,
            'description' => $data->description,
            'is_collection' => $data->is_collection,
        ]);
    }
}
