<?php

namespace App\Domains\Identity\Http\Requests\Auth;

use App\Domains\Identity\Rules\StrongPassword;
use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', new StrongPassword()],
        ];
    }
}
