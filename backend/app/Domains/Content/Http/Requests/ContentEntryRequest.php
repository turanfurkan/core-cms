<?php

namespace App\Domains\Content\Http\Requests;

use App\Domains\Content\Models\ContentEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContentEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'data' => ['required', 'array'],
            'status' => [
                'nullable',
                'string',
                Rule::in([ContentEntry::STATUS_DRAFT, ContentEntry::STATUS_PUBLISHED, ContentEntry::STATUS_ARCHIVED]),
            ],
            'seo' => ['nullable', 'array'],
            'seo.canonical_url' => ['nullable', 'string', 'max:255'],
            'seo.meta_robots' => ['nullable', 'string', 'max:100'],
            'seo.og_image_id' => ['nullable', 'integer'],
            'seo.meta_title' => ['nullable'],
            'seo.meta_description' => ['nullable'],
            'seo.meta_keywords' => ['nullable'],
            'seo.og_title' => ['nullable'],
            'seo.og_description' => ['nullable'],
        ];
    }
}
