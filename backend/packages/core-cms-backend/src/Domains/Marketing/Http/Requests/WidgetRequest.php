<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WidgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique('marketing_widgets', 'key')->ignore($this->route('widget')),
            ],
            'type' => ['required', 'string', 'max:255'],
            'config' => ['required', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
