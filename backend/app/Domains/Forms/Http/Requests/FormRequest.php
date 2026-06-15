<?php

namespace App\Domains\Forms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest as BaseFormRequest;
use Illuminate\Validation\Rule;

class FormRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $formId = $this->route('form') ? $this->route('form')->id : null;

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('forms', 'slug')->ignore($formId),
                'regex:/^[a-z0-9-]+$/i', // slug format
            ],
            'description' => ['nullable', 'string'],
            'recipient_email' => ['nullable', 'email', 'max:255'],
            'settings' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
            'fields' => ['nullable', 'array'],
            'fields.*.type' => [
                'required',
                'string',
                Rule::in(['text', 'textarea', 'email', 'select', 'checkbox', 'radio', 'file', 'number', 'date']),
            ],
            'fields.*.name' => ['required', 'string', 'max:50', 'regex:/^[a-zA-Z0-9_]+$/'],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.is_required' => ['nullable', 'boolean'],
            'fields.*.validation_rules' => ['nullable', 'array'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.order' => ['nullable', 'integer'],
        ];
    }
}
