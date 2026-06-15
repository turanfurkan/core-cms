<?php

namespace App\Domains\Integration\Http\Requests;

use Illuminate\Foundation\Http\FormRequest as BaseFormRequest;
use Illuminate\Validation\Rule;

class WebhookRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2000'],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['string', Rule::in(['user.registered', 'form.submitted', 'content.published'])],
            'secret' => ['nullable', 'string', 'max:255'],
            'headers' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
