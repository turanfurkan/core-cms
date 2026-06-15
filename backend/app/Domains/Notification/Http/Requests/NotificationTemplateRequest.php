<?php

namespace App\Domains\Notification\Http\Requests;

use Illuminate\Foundation\Http\FormRequest as BaseFormRequest;
use Illuminate\Validation\Rule;

class NotificationTemplateRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $templateId = $this->route('template') ? $this->route('template')->id : null;

        return [
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('notification_templates', 'code')->ignore($templateId),
                'regex:/^[a-zA-Z0-9_-]+$/',
            ],
            'name' => ['required', 'string', 'max:255'],
            'channels' => ['required', 'array'],
            'channels.*' => ['required', 'string', Rule::in(['mail', 'sms', 'database'])],
            'subject' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
