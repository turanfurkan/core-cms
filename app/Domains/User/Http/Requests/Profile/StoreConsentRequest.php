<?php

namespace App\Domains\User\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class StoreConsentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'consent_type' => ['required', 'string', 'in:kvkk,tos,privacy,marketing'],
            'version' => ['required', 'string'],
        ];
    }
}
