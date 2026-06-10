<?php

namespace App\Domains\Identity\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->can('user.viewAny');
    }

    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'query' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'string', 'in:name,email,phone,status,createdAt,lastSignInAt,role_name'],
            'dir' => ['nullable', 'string', 'in:asc,desc'],
            'status' => ['nullable', 'string', 'in:active,blocked,suspended,all'],
            'role_id' => ['nullable', 'string'], // support role ID or name
        ];
    }
}
