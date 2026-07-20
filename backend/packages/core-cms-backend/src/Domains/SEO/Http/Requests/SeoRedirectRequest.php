<?php

namespace TuranFurkan\CoreCms\Domains\SEO\Http\Requests;

use Illuminate\Foundation\Http\FormRequest as BaseFormRequest;
use Illuminate\Validation\Rule;

class SeoRedirectRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $redirectId = $this->route('redirect') ? $this->route('redirect')->id : null;

        return [
            'source_path' => [
                'required',
                'string',
                'max:255',
                Rule::unique('seo_redirects', 'source_path')->ignore($redirectId),
                'regex:/^\/[a-zA-Z0-9_\-\/]*$/',
            ],
            'target_path' => [
                'required',
                'string',
                'max:255',
                'regex:/^\/[a-zA-Z0-9_\-\/]*$/',
            ],
            'status_code' => ['nullable', 'integer', Rule::in([301, 302])],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
