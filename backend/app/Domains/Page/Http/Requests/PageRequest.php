<?php

namespace App\Domains\Page\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PageRequest extends FormRequest
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
            'layout' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:draft,published,archived',
            'is_system' => 'nullable|boolean',
            'is_homepage' => 'nullable|boolean',
            'parent_id' => 'nullable|integer|exists:pages,id',
            'order' => 'nullable|integer|min:0',
            'cover_image_id' => 'nullable|integer|exists:media,id',
        ];
    }
}
