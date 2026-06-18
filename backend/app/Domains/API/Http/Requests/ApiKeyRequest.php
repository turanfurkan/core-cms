<?php

namespace App\Domains\API\Http\Requests;

use Illuminate\Foundation\Http\FormRequest as BaseFormRequest;
use Illuminate\Validation\Rule;

class ApiKeyRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'scopes' => ['required', 'array', 'min:1'],
            'scopes.*' => [
                'string',
                Rule::in([
                    '*',
                    'content:read',
                    'forms:read',
                    'forms:submit',
                    'navigation:read',
                    'settings:read',
                    'seo:read',
                ])
            ],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
