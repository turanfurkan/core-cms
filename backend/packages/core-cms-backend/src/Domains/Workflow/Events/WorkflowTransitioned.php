<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\Events;

use TuranFurkan\CoreCms\Domains\Workflow\Models\WorkflowLog;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkflowTransitioned
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly WorkflowLog $log
    ) {}
}
