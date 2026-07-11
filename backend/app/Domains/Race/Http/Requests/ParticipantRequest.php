<?php

namespace App\Domains\Race\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ParticipantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|integer|exists:users,id',
            'name' => 'required|string|max:191',
            'gender' => 'required|string|in:male,female,other',
            'date_of_birth' => 'required|date',
            'identity_number' => 'required|string|max:50',
            'blood_type' => 'nullable|string|max:10',
            'phone_number' => 'required|string|max:50',
            't_shirt_size' => 'nullable|string|max:10',
            'club_name' => 'nullable|string|max:191',
            'nationality' => 'required|string|max:50',
            'emergency_contact' => 'required|string|max:191',
            'emergency_phone_number' => 'required|string|max:50',
            'address' => 'required|string',
            'race_id' => 'nullable|integer|exists:races,id',
            'status' => 'nullable|string|max:20',
            'bib_number' => 'nullable|string|max:50',
            'certificate_status' => 'nullable|string|max:20',
        ];
    }
}
