<?php

namespace App\Domains\Localization\Actions;

use App\Domains\Localization\DTOs\TranslationData;
use App\Domains\Localization\Models\Translation;

class UpsertTranslationAction
{
    public function execute(TranslationData $dto): Translation
    {
        return Translation::updateOrCreate(
            [
                'group' => $dto->group,
                'key' => $dto->key,
            ],
            [
                'text' => $dto->text,
            ]
        );
    }
}
