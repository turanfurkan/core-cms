<?php

namespace App\Domains\Content\Actions\Schemas;

use App\Domains\Content\Models\ContentType;

class DeleteContentTypeAction
{
    public function execute(ContentType $contentType): bool
    {
        return $contentType->delete();
    }
}
