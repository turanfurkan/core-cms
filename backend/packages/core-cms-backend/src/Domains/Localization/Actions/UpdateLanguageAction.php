<?php

namespace TuranFurkan\CoreCms\Domains\Localization\Actions;

use TuranFurkan\CoreCms\Domains\Localization\DTOs\LanguageData;
use TuranFurkan\CoreCms\Domains\Localization\Models\Language;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateLanguageAction
{
    public function execute(Language $language, LanguageData $dto): Language
    {
        return DB::transaction(function () use ($language, $dto) {
            $isDefault = $dto->isDefault;

            if ($language->is_default && !$isDefault) {
                throw ValidationException::withMessages([
                    'is_default' => 'Sistemde en az bir varsayılan dil bulunmalıdır. Başka bir dili varsayılan yapın.'
                ]);
            }

            if ($isDefault) {
                Language::where('is_default', true)->update(['is_default' => false]);
            }

            $language->update([
                'name' => $dto->name,
                'code' => strtolower($dto->code),
                'is_default' => $isDefault,
                'is_active' => $isDefault ? true : $dto->isActive,
                'direction' => $dto->direction,
                'order' => $dto->order,
            ]);

            return $language;
        });
    }
}
