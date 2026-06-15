<?php

namespace App\Domains\Localization\Actions;

use App\Domains\Localization\Models\Language;
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
