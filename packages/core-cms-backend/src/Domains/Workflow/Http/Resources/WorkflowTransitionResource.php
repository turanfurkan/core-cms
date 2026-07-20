<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowTransitionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'from_state_id' => $this->from_state_id,
            'to_state_id' => $this->to_state_id,
            'required_role' => $this->required_role,
        ];
    }
}
