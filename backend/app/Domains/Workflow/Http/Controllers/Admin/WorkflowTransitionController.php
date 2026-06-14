<?php

namespace App\Domains\Workflow\Http\Controllers\Admin;

use App\Domains\Workflow\Actions\ExecuteTransitionAction;
use App\Domains\Workflow\Http\Requests\TriggerTransitionRequest;
use App\Domains\Workflow\Http\Resources\WorkflowAssignmentResource;
use App\Domains\Workflow\Http\Resources\WorkflowLogResource;
use App\Domains\Workflow\Http\Resources\WorkflowTransitionResource;
use App\Domains\Workflow\Models\WorkflowTransition;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkflowTransitionController extends Controller
{
    protected function resolveModel(string $type, int $id)
    {
        $map = [
            'content_entry' => \App\Domains\Content\Models\ContentEntry::class,
        ];

        $class = $map[$type] ?? null;
        if (!$class) {
            throw new \InvalidArgumentException("Geçersiz kaynak tipi: {$type}");
        }

        return $class::findOrFail($id);
    }

    public function availableTransitions(string $resourceType, int $resourceId): JsonResponse
    {
        $model = $this->resolveModel($resourceType, $resourceId);
        $assignment = $model->workflowAssignment;

        if (!$assignment) {
            return response()->json([]);
        }

        $transitions = WorkflowTransition::where('from_state_id', $assignment->workflow_state_id)->get();

        return response()->json(WorkflowTransitionResource::collection($transitions));
    }

    public function triggerTransition(
        string $resourceType,
        int $resourceId,
        TriggerTransitionRequest $request,
        ExecuteTransitionAction $action
    ): JsonResponse {
        $model = $this->resolveModel($resourceType, $resourceId);
        $transition = WorkflowTransition::findOrFail($request->input('transition_id'));

        $assignment = $action->execute($model, $transition, $request->input('comment'));

        return response()->json([
            'message' => 'Durum geçişi başarıyla tamamlandı.',
            'assignment' => new WorkflowAssignmentResource($assignment->load('state')),
        ]);
    }

    public function history(string $resourceType, int $resourceId): AnonymousResourceCollection
    {
        $model = $this->resolveModel($resourceType, $resourceId);
        $logs = $model->workflowLogs()->with(['fromState', 'toState', 'transition', 'user'])->orderBy('id', 'desc')->get();

        return WorkflowLogResource::collection($logs);
    }
}
