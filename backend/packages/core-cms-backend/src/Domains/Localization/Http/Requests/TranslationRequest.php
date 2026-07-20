<?php

namespace TuranFurkan\CoreCms\Domains\Localization\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TranslationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'group' => ['nullable', 'string', 'max:50'],
            'key' => ['required', 'string', 'max:100'],
            'text' => ['required', 'array'],
        ];
    }
}
