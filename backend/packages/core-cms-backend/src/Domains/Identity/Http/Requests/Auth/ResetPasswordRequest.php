<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Rules\StrongPassword;
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
