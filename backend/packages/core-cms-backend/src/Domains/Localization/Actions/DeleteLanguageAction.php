<?php

namespace TuranFurkan\CoreCms\Domains\Localization\Actions;

use TuranFurkan\CoreCms\Domains\Localization\Models\Language;
use Illuminate\Validation\ValidationException;

class DeleteLanguageAction
{
    public function execute(Language $language): bool
    {
        if ($language->is_default) {
            throw ValidationException::withMessages([
                'language' => 'Varsayılan sistem dili silinemez.'
            ]);
        }

        return (bool) $language->delete();
    }
}
