<?php

namespace App\Domains\SEO\Http\Requests;

use Illuminate\Foundation\Http\FormRequest as BaseFormRequest;
use Illuminate\Validation\Rule;

class SeoPathRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $seoPathId = $this->route('path') ? $this->route('path')->id : null;

        return [
            'path' => [
                'required',
                'string',
                'max:255',
                Rule::unique('seo_paths', 'path')->ignore($seoPathId),
                'regex:/^\/[a-zA-Z0-9_\-\/]*$/',
            ],
            'meta_title' => ['nullable', 'array'],
            'meta_title.*' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'array'],
            'meta_description.*' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'array'],
            'meta_keywords.*' => ['nullable', 'string', 'max:255'],
            'og_title' => ['nullable', 'array'],
            'og_title.*' => ['nullable', 'string', 'max:255'],
            'og_description' => ['nullable', 'array'],
            'og_description.*' => ['nullable', 'string', 'max:500'],
            'og_image_id' => ['nullable', 'integer'],
            'canonical_url' => ['nullable', 'string', 'max:2000'], // relaxed to string to allow absolute or relative URLs
            'meta_robots' => ['nullable', 'string', 'max:255'],
        ];
    }
}
