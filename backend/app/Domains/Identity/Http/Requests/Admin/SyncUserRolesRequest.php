<?php

namespace App\Domains\Identity\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SyncUserRolesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('role.assign');
    }

    public function rules(): array
    {
        return [
            'roles' => ['required', 'array'],
            'roles.*' => ['required', 'string', 'exists:roles,name'],
        ];
    }
}
