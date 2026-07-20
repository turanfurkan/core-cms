<?php

namespace TuranFurkan\CoreCms\Domains\Post\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|array',
            'title.tr' => 'required|string|max:191',
            'title.en' => 'nullable|string|max:191',
            'slug' => 'required|array',
            'slug.tr' => 'required|string|max:191',
            'slug.en' => 'nullable|string|max:191',
            'content' => 'nullable|array',
            'summary' => 'nullable|array',
            'summary.tr' => 'nullable|string|max:500',
            'summary.en' => 'nullable|string|max:500',
            'cover_image_id' => 'nullable|integer|exists:media,id',
            'reading_time' => 'nullable|integer|min:0',
            'publish_date' => 'nullable|date',
            'status' => 'nullable|string|in:draft,published,archived',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer|exists:categories,id',
        ];
    }
}
