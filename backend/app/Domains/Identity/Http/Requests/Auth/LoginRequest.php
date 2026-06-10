<?php

namespace App\Domains\Identity\Http\Requests\Auth;

use App\Domains\Identity\Rules\LoginIdentifier;
use App\Domains\Identity\Support\PhoneNumberNormalizer;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('login')) {
            return;
        }

        $raw = (string) $this->input('login');

        $normalized = app(PhoneNumberNormalizer::class)->normalize($raw);
        if ($normalized !== null) {
            $this->merge([
                'login' => $normalized,
                'login_type' => 'phone',
            ]);

            return;
        }

        if (filter_var($raw, FILTER_VALIDATE_EMAIL) !== false) {
            $this->merge([
                'login' => mb_strtolower($raw),
                'login_type' => 'email',
            ]);

            return;
        }

        $this->merge(['login_type' => null]);
    }

    public function rules(): array
    {
        return [
            'login' => ['required', 'string', 'max:191', new LoginIdentifier()],
            'password' => ['required', 'string', 'max:191'],
        ];
    }

    public function messages(): array
    {
        return [
            'login.required' => 'The login (email or phone) is required.',
            'password.required' => 'The password is required.',
        ];
    }

    public function resolvedType(): ?string
    {
        $type = $this->input('login_type');

        return is_string($type) && $type !== '' ? $type : null;
    }
}
