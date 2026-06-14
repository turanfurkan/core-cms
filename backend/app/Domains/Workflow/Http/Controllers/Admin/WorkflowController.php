<?php

namespace App\Domains\Workflow\Http\Controllers\Admin;

use App\Domains\Workflow\Actions\CreateWorkflowAction;
use App\Domains\Workflow\DTOs\StateData;
use App\Domains\Workflow\DTOs\TransitionData;
use App\Domains\Workflow\DTOs\WorkflowData;
use App\Domains\Workflow\Http\Requests\CreateWorkflowRequest;
use App\Domains\Workflow\Http\Resources\WorkflowResource;
use App\Domains\Workflow\Models\Workflow;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkflowController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $workflows = Workflow::with(['states', 'transitions'])->get();
        return WorkflowResource::collection($workflows);
    }

    public function store(CreateWorkflowRequest $request, CreateWorkflowAction $action): JsonResponse
    {
        $workflowDto = WorkflowData::fromArray($request->validated());
        
        $states = array_map(
            fn($s) => StateData::fromArray($s),
            $request->input('states')
        );

        $transitions = array_map(
            fn($t) => TransitionData::fromArray($t),
            $request->input('transitions')
        );

        $workflow = $action->execute($workflowDto, $states, $transitions);

        return (new WorkflowResource($workflow->load(['states', 'transitions'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Workflow $workflow): WorkflowResource
    {
        return new WorkflowResource($workflow->load(['states', 'transitions']));
    }

    public function destroy(Workflow $workflow): JsonResponse
    {
        $workflow->delete();

        return response()->json([
            'message' => 'Workflow deleted successfully.',
        ]);
    }
}
