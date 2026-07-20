<?php

namespace TuranFurkan\CoreCms\Domains\Forms\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $this->name,
            'label' => $this->label,
            'placeholder' => $this->placeholder,
            'is_required' => $this->is_required,
            'validation_rules' => $this->validation_rules,
            'options' => $this->options,
            'order' => $this->order,
        ];
    }
}
