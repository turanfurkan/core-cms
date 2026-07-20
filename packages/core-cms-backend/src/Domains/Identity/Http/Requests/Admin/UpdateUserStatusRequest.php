<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Admin;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('user.update.any');
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    User::STATUS_ACTIVE,
                    User::STATUS_BLOCKED,
                    User::STATUS_SUSPENDED
                ])
            ],
        ];
    }
}
