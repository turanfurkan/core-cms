<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'from_state' => new WorkflowStateResource($this->whenLoaded('fromState')),
            'to_state' => new WorkflowStateResource($this->whenLoaded('toState')),
            'transition' => new WorkflowTransitionResource($this->whenLoaded('transition')),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                ];
            }),
            'comment' => $this->comment,
            'created_at' => $this->created_at,
        ];
    }
}
