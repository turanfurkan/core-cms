<?php

namespace TuranFurkan\CoreCms\Domains\Partner\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'array'],
            'name.tr' => ['required', 'string'],
            'name.en' => ['nullable', 'string'],
            'logo_id' => ['nullable', 'integer', 'exists:media,id'],
            'link' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:draft,published,archived'],
            'order' => ['nullable', 'integer'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
        ];
    }
}
