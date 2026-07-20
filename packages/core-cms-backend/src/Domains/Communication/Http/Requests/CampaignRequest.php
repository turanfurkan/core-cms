<?php

namespace TuranFurkan\CoreCms\Domains\Communication\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'template_code' => ['required', 'string', 'exists:notification_templates,code'],
            'scheduled_at' => ['nullable', 'date'],
        ];
    }
}
