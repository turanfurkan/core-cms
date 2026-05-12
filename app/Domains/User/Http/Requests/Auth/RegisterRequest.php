<?php

namespace App\Domains\User\Http\Requests\Auth;

use App\Domains\User\Rules\PhoneNumber;
use App\Domains\User\Rules\StrongPassword;
use App\Domains\User\Support\PhoneNumberNormalizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
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

        if ($this->filled('email')) {
            $this->merge(['email' => mb_strtolower((string) $this->input('email'))]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:191'],
            'phone' => [
                'required',
                'string',
                'max:20',
                new PhoneNumber(),
                Rule::unique('users', 'phone'),
            ],
            'email' => [
                'nullable',
                'string',
                'email:rfc',
                'max:191',
                Rule::unique('users', 'email'),
            ],
            'password' => ['required', 'string', new StrongPassword()],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.unique' => 'A user with this phone number already exists.',
            'email.unique' => 'A user with this email already exists.',
        ];
    }
}
