<?php

namespace App\Domains\Workflow\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'states' => WorkflowStateResource::collection($this->whenLoaded('states')),
            'transitions' => WorkflowTransitionResource::collection($this->whenLoaded('transitions')),
        ];
    }
}
