<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Rules\PhoneNumber;
use TuranFurkan\CoreCms\Domains\Identity\Support\PhoneNumberNormalizer;
use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
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
            'code' => ['required', 'string', 'min:4', 'max:10'],
            'request_id' => ['nullable', 'string', 'uuid'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Telefon numarası zorunludur.',
            'code.required' => 'Doğrulama kodu zorunludur.',
            'code.min' => 'Doğrulama kodu en az 4 karakter olmalıdır.',
            'code.max' => 'Doğrulama kodu en fazla 10 karakter olmalıdır.',
        ];
    }
}
