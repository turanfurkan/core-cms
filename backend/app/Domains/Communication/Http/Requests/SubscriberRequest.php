<?php

namespace App\Domains\Communication\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubscriberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'email' => [
                'required_without:phone',
                'nullable',
                'email',
                'max:255',
            ],
            'phone' => [
                'required_without:email',
                'nullable',
                'string',
                'max:255',
            ],
            'status' => ['nullable', 'string', Rule::in(['active', 'unsubscribed', 'pending'])],
            'consent_given' => ['nullable', 'boolean'],
        ];

        if ($this->is('api/admin/*')) {
            $rules['email'][] = Rule::unique('subscribers', 'email')->ignore($this->route('subscriber'));
            $rules['phone'][] = Rule::unique('subscribers', 'phone')->ignore($this->route('subscriber'));
        }

        return $rules;
    }
}
