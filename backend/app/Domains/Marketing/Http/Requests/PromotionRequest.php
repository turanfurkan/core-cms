<?php

namespace App\Domains\Marketing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PromotionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(['banner', 'popup', 'announcement'])],
            'content' => ['required', 'array'],
            'rules' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
