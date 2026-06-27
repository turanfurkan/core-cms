<?php

namespace App\Domains\Media\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:102400'], // Max 100MB
            'folder_id' => ['nullable', 'integer', 'exists:media_folders,id'],
        ];
    }
}
