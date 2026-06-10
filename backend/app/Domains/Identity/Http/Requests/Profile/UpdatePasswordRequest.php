<?php

namespace App\Domains\Identity\Http\Requests\Profile;

use App\Domains\Identity\Rules\StrongPassword;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', new StrongPassword()],
        ];
    }
}
