<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Admin;

use TuranFurkan\CoreCms\Domains\Identity\Rules\PhoneNumber;
use TuranFurkan\CoreCms\Domains\Identity\Rules\StrongPassword;
use TuranFurkan\CoreCms\Domains\Identity\Support\PhoneNumberNormalizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->can('user.create');
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
                'nullable',
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
            'password' => ['nullable', 'string', Rule::when(fn() => $this->filled('password'), [new StrongPassword()])],
            'role' => ['required', 'string', 'exists:roles,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.unique' => 'A user with this phone number already exists.',
            'email.unique' => 'A user with this email already exists.',
            'role.exists' => 'The selected role is invalid.',
        ];
    }
}
