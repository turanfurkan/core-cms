<?php

namespace App\Domains\Localization\Actions;

use App\Domains\Localization\DTOs\LanguageData;
use App\Domains\Localization\Models\Language;
use Illuminate\Support\Facades\DB;

class CreateLanguageAction
{
    public function execute(LanguageData $dto): Language
    {
        return DB::transaction(function () use ($dto) {
            $isDefault = $dto->isDefault;
            
            // First language must be default
            if (Language::count() === 0) {
                $isDefault = true;
            }

            if ($isDefault) {
                Language::where('is_default', true)->update(['is_default' => false]);
            }

            return Language::create([
                'name' => $dto->name,
                'code' => strtolower($dto->code),
                'is_default' => $isDefault,
                'is_active' => $isDefault ? true : $dto->isActive,
                'direction' => $dto->direction,
                'order' => $dto->order,
            ]);
        });
    }
}
