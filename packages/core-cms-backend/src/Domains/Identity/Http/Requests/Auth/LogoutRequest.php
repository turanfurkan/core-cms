<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LogoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'scope' => [
                'required',
                'string',
                Rule::in(['current_only', 'all_devices', 'all_except_current'])
            ],
            'target_user_id' => [
                'nullable',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    if ($value && (int) $value !== (int) auth()->id()) {
                        if (!auth()->user()->can('user.revoke')) {
                            $fail('Başka bir kullanıcının oturumunu sonlandırma yetkiniz yok.');
                        }
                    }
                }
            ],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'scope.required' => 'Çıkış kapsamı (scope) belirtilmelidir.',
            'scope.in' => 'Geçersiz çıkış kapsamı.',
        ];
    }
}
