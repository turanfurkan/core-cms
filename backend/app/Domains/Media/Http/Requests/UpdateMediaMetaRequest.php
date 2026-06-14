<?php

namespace App\Domains\Media\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMediaMetaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'alt_text' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'caption' => ['nullable', 'string', 'max:255'],
        ];
    }
}
