<?php

namespace TuranFurkan\CoreCms\Domains\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest as BaseFormRequest;

class SettingsRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable'],
        ];
    }
}
