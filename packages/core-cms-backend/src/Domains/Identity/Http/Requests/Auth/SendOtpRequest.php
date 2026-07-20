<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Rules\PhoneNumber;
use TuranFurkan\CoreCms\Domains\Identity\Support\PhoneNumberNormalizer;
use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('phone')) {
            $normalized = app(PhoneNumberNormalizer::class)->normalize((string) $this->input('phone'));
            if ($normalized !== null) {
                $this->merge(['phone' => $normalized]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', new PhoneNumber()],
            'purpose' => ['nullable', 'string', 'in:login'],
            'channel' => ['nullable', 'string', 'in:sms'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Phone number is required.',
        ];
    }
}
