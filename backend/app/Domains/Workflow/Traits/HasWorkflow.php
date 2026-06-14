<?php

namespace App\Domains\Workflow\Traits;

use App\Domains\Workflow\Models\Workflow;
use App\Domains\Workflow\Models\WorkflowAssignment;
use App\Domains\Workflow\Models\WorkflowLog;
use App\Domains\Workflow\Models\WorkflowState;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\DB;

trait HasWorkflow
{
    public function workflowAssignment(): MorphOne
    {
        return $this->morphOne(WorkflowAssignment::class, 'workflowable');
    }

    public function workflowLogs(): MorphMany
    {
        return $this->morphMany(WorkflowLog::class, 'workflowable');
    }

    public function currentWorkflowState(): ?WorkflowState
    {
        return $this->workflowAssignment?->state;
    }

    public function assignWorkflow(Workflow $workflow): WorkflowAssignment
    {
        return DB::transaction(function () use ($workflow) {
            $initialState = $workflow->getInitialState();
            if (!$initialState) {
                throw new \RuntimeException("Başlangıç durumu (is_initial) tanımlanmamış iş akışı: {$workflow->name}");
            }

            // Delete old assignment if any
            $this->workflowAssignment()?->delete();

            $assignment = $this->workflowAssignment()->create([
                'workflow_id' => $workflow->id,
                'workflow_state_id' => $initialState->id,
            ]);

            // Log initial assignment
            $this->workflowLogs()->create([
                'workflow_id' => $workflow->id,
                'from_state_id' => null,
                'to_state_id' => $initialState->id,
                'transition_id' => null,
                'user_id' => auth()->id(),
                'comment' => 'İş akışı atandı ve başlangıç durumuna alındı.',
            ]);

            return $assignment;
        });
    }
}
