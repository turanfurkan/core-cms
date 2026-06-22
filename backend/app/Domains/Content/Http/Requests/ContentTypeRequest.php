<?php

namespace App\Domains\Content\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization is handled via middleware
    }

    public function rules(): array
    {
        $contentTypeId = $this->route('content_type')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('content_types', 'slug')->ignore($contentTypeId),
            ],
            'description' => ['nullable', 'string'],
            'is_collection' => ['boolean'],
            'settings' => ['nullable', 'array'],
            'fields' => ['array'],
            'fields.*.name' => ['required', 'string', 'max:255'],
            'fields.*.slug' => ['required', 'string', 'max:255'],
            'fields.*.type' => ['required', 'string', 'max:255'],
            'fields.*.validation_rules' => ['array', 'nullable'],
            'fields.*.options' => ['array', 'nullable'],
            'fields.*.order' => ['integer', 'nullable'],
        ];
    }
}
