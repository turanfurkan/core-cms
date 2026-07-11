<?php

namespace App\Domains\Workflow\Listeners;

use App\Domains\Workflow\Events\WorkflowTransitioned;
use App\Domains\Post\Models\Post;
use App\Domains\Page\Models\Page;

class AutoPublishWorkflowListener
{
    public function handle(WorkflowTransitioned $event): void
    {
        $log = $event->log;
        $model = $log->workflowable;

        $toState = $log->toState;
        
        if ($toState && $toState->is_final && $toState->code === 'approved') {
            if ($model instanceof Post) {
                $model->update([
                    'status' => Post::STATUS_PUBLISHED,
                    'publish_date' => now(),
                ]);
            } elseif ($model instanceof Page) {
                $model->update([
                    'status' => Page::STATUS_PUBLISHED,
                ]);
            }
        }
    }
}
