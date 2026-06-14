<?php

namespace App\Domains\Workflow\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_id' => $this->workflow_id,
            'workflow_state_id' => $this->workflow_state_id,
            'state' => new WorkflowStateResource($this->whenLoaded('state')),
        ];
    }
}
