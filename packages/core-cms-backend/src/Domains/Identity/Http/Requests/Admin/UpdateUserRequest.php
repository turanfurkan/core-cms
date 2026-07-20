<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Admin;

use TuranFurkan\CoreCms\Domains\Identity\Rules\PhoneNumber;
use TuranFurkan\CoreCms\Domains\Identity\Support\PhoneNumberNormalizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->route('user');
        return $this->user() !== null && $this->user()->can('update', $user);
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
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:191'],
            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
                new PhoneNumber(),
                Rule::unique('users', 'phone')->ignore($user),
            ],
            'email' => [
                'sometimes',
                'nullable',
                'string',
                'email:rfc',
                'max:191',
                Rule::unique('users', 'email')->ignore($user),
            ],
            'status' => ['required', 'string', 'in:active,blocked,suspended'],
            'role' => ['nullable', 'string', 'exists:roles,name'],
            'password' => ['nullable', 'string', new \TuranFurkan\CoreCms\Domains\Identity\Rules\StrongPassword()],
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
