<?php

namespace App\Domains\Content\Actions\Schemas;

use App\Domains\Content\DTOs\ContentFieldData;
use App\Domains\Content\Models\ContentField;
use App\Domains\Content\Models\ContentType;
use Illuminate\Support\Facades\DB;

class SaveContentFieldsAction
{
    /**
     * @param ContentType $contentType
     * @param ContentFieldData[] $fieldsData
     * @return ContentType
     */
    public function execute(ContentType $contentType, array $fieldsData): ContentType
    {
        return DB::transaction(function () use ($contentType, $fieldsData) {
            $incomingSlugs = [];

            foreach ($fieldsData as $fieldDto) {
                $incomingSlugs[] = $fieldDto->slug;

                ContentField::updateOrCreate(
                    [
                        'content_type_id' => $contentType->id,
                        'slug' => $fieldDto->slug,
                    ],
                    [
                        'name' => $fieldDto->name,
                        'type' => $fieldDto->type,
                        'validation_rules' => $fieldDto->validation_rules,
                        'options' => $fieldDto->options,
                        'order' => $fieldDto->order,
                    ]
                );
            }

            // Delete fields that are no longer in the request
            $contentType->fields()
                ->whereNotIn('slug', $incomingSlugs)
                ->delete();

            return $contentType->load('fields');
        });
    }
}
