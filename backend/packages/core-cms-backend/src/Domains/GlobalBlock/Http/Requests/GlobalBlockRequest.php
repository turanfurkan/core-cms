<?php

namespace TuranFurkan\CoreCms\Domains\GlobalBlock\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GlobalBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'content' => 'nullable|array',
            'styles' => 'nullable|array',
            'status' => 'nullable|string|in:active,inactive',
        ];
    }
}
