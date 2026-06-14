<?php

namespace App\Domains\Workflow\Actions;

use App\Domains\Workflow\DTOs\WorkflowData;
use App\Domains\Workflow\DTOs\StateData;
use App\Domains\Workflow\DTOs\TransitionData;
use App\Domains\Workflow\Models\Workflow;
use Illuminate\Support\Facades\DB;

class CreateWorkflowAction
{
    /**
     * @param WorkflowData $workflowData
     * @param StateData[] $states
     * @param TransitionData[] $transitions
     */
    public function execute(WorkflowData $workflowData, array $states, array $transitions): Workflow
    {
        return DB::transaction(function () use ($workflowData, $states, $transitions) {
            $workflow = Workflow::create([
                'name' => $workflowData->name,
                'code' => $workflowData->code,
                'description' => $workflowData->description,
                'is_active' => $workflowData->isActive,
            ]);

            $createdStates = [];
            foreach ($states as $stateDto) {
                $state = $workflow->states()->create([
                    'name' => $stateDto->name,
                    'code' => $stateDto->code,
                    'is_initial' => $stateDto->isInitial,
                    'is_final' => $stateDto->isFinal,
                ]);
                $createdStates[$stateDto->code] = $state;
            }

            foreach ($transitions as $transitionDto) {
                $fromState = $createdStates[$transitionDto->fromStateCode] ?? null;
                $toState = $createdStates[$transitionDto->toStateCode] ?? null;

                if (!$fromState || !$toState) {
                    throw new \InvalidArgumentException("Geçersiz kaynak ({$transitionDto->fromStateCode}) veya hedef ({$transitionDto->toStateCode}) durum kodu.");
                }

                $workflow->transitions()->create([
                    'name' => $transitionDto->name,
                    'from_state_id' => $fromState->id,
                    'to_state_id' => $toState->id,
                    'required_role' => $transitionDto->requiredRole,
                ]);
            }

            return $workflow;
        });
    }
}
