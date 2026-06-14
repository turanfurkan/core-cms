<?php

namespace App\Domains\Workflow\Actions;

use App\Domains\Identity\Models\User;
use App\Domains\Workflow\Events\WorkflowTransitioned;
use App\Domains\Workflow\Models\WorkflowTransition;
use App\Domains\Workflow\Models\WorkflowAssignment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExecuteTransitionAction
{
    public function execute($model, WorkflowTransition $transition, ?string $comment = null, ?User $user = null): WorkflowAssignment
    {
        $user = $user ?? auth()->user();

        if (!method_exists($model, 'workflowAssignment')) {
            throw new \InvalidArgumentException("Model HasWorkflow trait'ini kullanmıyor.");
        }

        $assignment = $model->workflowAssignment;

        if (!$assignment) {
            throw new \RuntimeException("Model için aktif bir iş akışı ataması bulunamadı.");
        }

        // Validate the workflow match
        if ($assignment->workflow_id !== $transition->workflow_id) {
            throw ValidationException::withMessages([
                'transition_id' => 'Seçilen geçiş, atanmış iş akışına ait değil.'
            ]);
        }

        // Validate current state matches source state of transition
        if ($assignment->workflow_state_id !== $transition->from_state_id) {
            throw ValidationException::withMessages([
                'transition_id' => 'Mevcut durum bu geçişi yapmak için uygun değil.'
            ]);
        }

        // Validate user role if required_role is set
        if ($transition->required_role !== null) {
            if (!$user || !$user->hasRole($transition->required_role)) {
                throw ValidationException::withMessages([
                    'role' => "Bu işlemi gerçekleştirmek için yetkiniz yok. Gerekli rol: {$transition->required_role}."
                ]);
            }
        }

        return DB::transaction(function () use ($model, $assignment, $transition, $user, $comment) {
            $oldStateId = $assignment->workflow_state_id;

            // Update current state
            $assignment->update([
                'workflow_state_id' => $transition->to_state_id,
            ]);

            // Create Log
            $log = $model->workflowLogs()->create([
                'workflow_id' => $transition->workflow_id,
                'from_state_id' => $oldStateId,
                'to_state_id' => $transition->to_state_id,
                'transition_id' => $transition->id,
                'user_id' => $user?->id,
                'comment' => $comment,
            ]);

            // Trigger Event
            event(new WorkflowTransitioned($log));

            return $assignment;
        });
    }
}
