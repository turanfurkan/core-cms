<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\Actions;

use TuranFurkan\CoreCms\Domains\Workflow\Models\Workflow;
use TuranFurkan\CoreCms\Domains\Workflow\Models\WorkflowAssignment;

class AssignWorkflowAction
{
    public function execute($model, Workflow $workflow): WorkflowAssignment
    {
        if (!method_exists($model, 'assignWorkflow')) {
            throw new \InvalidArgumentException("Model HasWorkflow trait'ini kullanmıyor.");
        }

        return $model->assignWorkflow($workflow);
    }
}
