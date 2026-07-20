<?php

namespace TuranFurkan\CoreCms\Domains\Navigation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest as BaseFormRequest;
use Illuminate\Validation\Rule;

class NavigationRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $navigationId = $this->route('navigation') ? $this->route('navigation')->id : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique('navigations', 'key')->ignore($navigationId),
                'regex:/^[a-zA-Z0-9_-]+$/',
            ],
            'is_active' => ['nullable', 'boolean'],
            'items' => ['nullable', 'array'],
            'items.*.title' => ['required'],
            'items.*.type' => ['required', 'string', Rule::in(['custom', 'content'])],
            'items.*.url' => ['nullable', 'string', 'max:2000'],
            'items.*.linked_resource_type' => ['nullable', 'string', 'max:255'],
            'items.*.linked_resource_id' => ['nullable', 'integer'],
            'items.*.target' => ['nullable', 'string', Rule::in(['_self', '_blank'])],
            'items.*.is_active' => ['nullable', 'boolean'],
            'items.*.children' => ['nullable', 'array'],
        ];
    }
}
