<?php

namespace TuranFurkan\CoreCms\Domains\Forms\Actions;

use TuranFurkan\CoreCms\Domains\Forms\DTOs\FormData;
use TuranFurkan\CoreCms\Domains\Forms\Models\Form;
use Illuminate\Support\Facades\DB;

class CreateFormAction
{
    public function execute(FormData $dto): Form
    {
        return DB::transaction(function () use ($dto) {
            $form = Form::create([
                'title' => $dto->title,
                'slug' => $dto->slug,
                'description' => $dto->description,
                'recipient_email' => $dto->recipientEmail,
                'settings' => $dto->settings,
                'is_active' => $dto->isActive,
            ]);

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

            return $form;
        });
    }
}
