<?php

namespace TuranFurkan\CoreCms\Domains\Race\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $registrationId = $this->route('registration')?->id;

        return [
            'participant_id' => [
                'required',
                'integer',
                'exists:participants,id',
                // Unique participant per race
                Rule::unique('race_registrations', 'participant_id')
                    ->where('race_id', $this->race_id)
                    ->ignore($registrationId),
            ],
            'race_id' => 'required|integer|exists:races,id',
            'user_id' => 'required|integer|exists:users,id',
            'race_category_id' => 'nullable|integer|exists:categories,id',
            'bib_number' => [
                'nullable',
                'string',
                'max:50',
                // Unique bib number per race
                Rule::unique('race_registrations', 'bib_number')
                    ->where('race_id', $this->race_id)
                    ->ignore($registrationId),
            ],
            'price' => 'required|numeric|min:0',
            'status' => 'nullable|string|max:20',
            'payment_id' => 'nullable|string|max:191',
            'group_id' => 'nullable|integer',
        ];
    }
}
