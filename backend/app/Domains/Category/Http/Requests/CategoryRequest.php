<?php

namespace App\Domains\Category\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authentication is checked at route middleware level
    }

    public function rules(): array
    {
        return [
            'name' => 'required|array',
            'name.tr' => 'required|string|max:191',
            'name.en' => 'nullable|string|max:191',
            'slug' => 'required|array',
            'slug.tr' => 'required|string|max:191',
            'slug.en' => 'nullable|string|max:191',
            'description' => 'nullable|array',
            'description.tr' => 'nullable|string',
            'description.en' => 'nullable|string',
            'image_id' => 'nullable|integer',
            'parent_id' => 'nullable|integer|exists:categories,id',
            'type' => 'required|string|max:100',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'tabs' => 'nullable|array',
            'field_settings' => 'nullable|array',
        ];
    }
}
