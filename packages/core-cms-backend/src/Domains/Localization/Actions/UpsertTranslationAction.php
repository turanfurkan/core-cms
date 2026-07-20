<?php

namespace TuranFurkan\CoreCms\Domains\Localization\Actions;

use TuranFurkan\CoreCms\Domains\Localization\DTOs\TranslationData;
use TuranFurkan\CoreCms\Domains\Localization\Models\Translation;

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
