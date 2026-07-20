<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TriggerTransitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'transition_id' => ['required', 'integer', 'exists:workflow_transitions,id'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
