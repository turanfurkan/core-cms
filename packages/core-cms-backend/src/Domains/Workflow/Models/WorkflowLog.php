<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\Models;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WorkflowLog extends Model
{
    protected $fillable = [
        'workflow_id',
        'workflowable_type',
        'workflowable_id',
        'from_state_id',
        'to_state_id',
        'transition_id',
        'user_id',
        'comment',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function fromState(): BelongsTo
    {
        return $this->belongsTo(WorkflowState::class, 'from_state_id');
    }

    public function toState(): BelongsTo
    {
        return $this->belongsTo(WorkflowState::class, 'to_state_id');
    }

    public function transition(): BelongsTo
    {
        return $this->belongsTo(WorkflowTransition::class, 'transition_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workflowable(): MorphTo
    {
        return $this->morphTo();
    }
}
