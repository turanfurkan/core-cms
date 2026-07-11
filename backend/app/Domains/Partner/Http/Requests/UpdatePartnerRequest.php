<?php

namespace App\Domains\Partner\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'array'],
            'name.tr' => ['required_with:name', 'string'],
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
