<?php

namespace App\Domains\Localization\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LanguageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $languageId = $this->route('language') ? $this->route('language')->id : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:10',
                Rule::unique('languages', 'code')->ignore($languageId),
            ],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'direction' => ['nullable', 'string', Rule::in(['ltr', 'rtl'])],
            'order' => ['nullable', 'integer'],
        ];
    }
}
