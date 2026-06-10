<?php

namespace App\Domains\Identity\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UploadDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'document_type' => ['required', 'string', 'in:id_card,passport,other'],
            'document' => ['required', 'file', 'mimes:pdf,jpeg,png,jpg', 'max:5120'],
        ];
    }
}
