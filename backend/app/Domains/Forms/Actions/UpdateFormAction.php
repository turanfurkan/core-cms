<?php

namespace App\Domains\Forms\Actions;

use App\Domains\Forms\DTOs\FormData;
use App\Domains\Forms\Models\Form;
use Illuminate\Support\Facades\DB;

class UpdateFormAction
{
    public function execute(Form $form, FormData $dto): Form
    {
        return DB::transaction(function () use ($form, $dto) {
            $form->update([
                'title' => $dto->title,
                'slug' => $dto->slug,
                'description' => $dto->description,
                'recipient_email' => $dto->recipientEmail,
                'settings' => $dto->settings,
                'is_active' => $dto->isActive,
            ]);

            $form->fields()->delete();

            foreach ($dto->fields as $fieldDto) {
                $form->fields()->create([
                    'type' => $fieldDto->type,
                    'name' => $fieldDto->name,
                    'label' => $fieldDto->label,
                    'placeholder' => $fieldDto->placeholder,
                    'is_required' => $fieldDto->isRequired,
                    'validation_rules' => $fieldDto->validationRules,
                    'options' => $fieldDto->options,
                    'order' => $fieldDto->order,
                ]);
            }

            return $form->fresh();
        });
    }
}
