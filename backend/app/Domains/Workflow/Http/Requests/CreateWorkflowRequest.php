<?php

namespace App\Domains\Workflow\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', 'unique:workflows,code'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
            'states' => ['required', 'array', 'min:1'],
            'states.*.name' => ['required', 'string', 'max:255'],
            'states.*.code' => ['required', 'string', 'max:100'],
            'states.*.is_initial' => ['nullable', 'boolean'],
            'states.*.is_final' => ['nullable', 'boolean'],
            'transitions' => ['required', 'array'],
            'transitions.*.name' => ['required', 'string', 'max:255'],
            'transitions.*.from_state_code' => ['required', 'string'],
            'transitions.*.to_state_code' => ['required', 'string'],
            'transitions.*.required_role' => ['nullable', 'string', 'max:100'],
        ];
    }
}
