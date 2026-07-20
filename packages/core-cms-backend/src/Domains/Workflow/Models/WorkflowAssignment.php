<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WorkflowAssignment extends Model
{
    protected $fillable = [
        'workflow_id',
        'workflow_state_id',
        'workflowable_type',
        'workflowable_id',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function state(): BelongsTo
    {
        return $this->belongsTo(WorkflowState::class, 'workflow_state_id');
    }

    public function workflowable(): MorphTo
    {
        return $this->morphTo();
    }
}
