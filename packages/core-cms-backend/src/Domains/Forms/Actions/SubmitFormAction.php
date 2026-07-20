<?php

namespace TuranFurkan\CoreCms\Domains\Forms\Actions;

use TuranFurkan\CoreCms\Domains\Forms\DTOs\FormSubmissionData;
use TuranFurkan\CoreCms\Domains\Forms\Events\FormSubmitted;
use TuranFurkan\CoreCms\Domains\Forms\Models\Form;
use TuranFurkan\CoreCms\Domains\Forms\Models\FormSubmission;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SubmitFormAction
{
    public function execute(Form $form, FormSubmissionData $dto): FormSubmission
    {
        $status = 'unread';
        $honeypotField = $form->settings['honeypot_field'] ?? 'hp_field';

        // Check if honeypot field is filled
        if (request()->filled($honeypotField)) {
            $status = 'spam';
        }

        $finalData = $dto->data;

        // Only validate and process if not flagged as spam
        if ($status !== 'spam') {
            $rules = [];
            foreach ($form->fields as $field) {
                $fieldRules = [];
                
                if ($field->is_required) {
                    $fieldRules[] = 'required';
                } else {
                    $fieldRules[] = 'nullable';
                }

                if ($field->type === 'email') {
                    $fieldRules[] = 'email';
                } elseif ($field->type === 'number') {
                    $fieldRules[] = 'numeric';
                } elseif ($field->type === 'date') {
                    $fieldRules[] = 'date';
                } elseif ($field->type === 'file') {
                    // In Laravel validation, file rule validates uploaded files
                    $fieldRules[] = 'file';
                }

                if (!empty($field->validation_rules) && is_array($field->validation_rules)) {
                    $fieldRules = array_merge($fieldRules, $field->validation_rules);
                }

                $rules[$field->name] = $fieldRules;
            }

            Validator::make($finalData, $rules)->validate();

            // Store files to local storage and map their details into JSON data
            foreach ($form->fields as $field) {
                if ($field->type === 'file' && request()->hasFile($field->name)) {
                    $file = request()->file($field->name);
                    $path = $file->store('form-attachments', 'public');
                    
                    $finalData[$field->name] = [
                        'original_name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'url' => Storage::disk('public')->url($path),
                    ];
                }
            }
        }

        $submission = FormSubmission::create([
            'form_id' => $form->id,
            'data' => $finalData,
            'ip_address' => $dto->ipAddress,
            'user_agent' => $dto->userAgent,
            'status' => $status,
        ]);

        if ($status !== 'spam') {
            event(new FormSubmitted($submission));
        }

        return $submission;
    }
}
