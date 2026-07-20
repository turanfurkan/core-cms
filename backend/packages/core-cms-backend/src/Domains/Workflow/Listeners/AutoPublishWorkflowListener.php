<?php

namespace TuranFurkan\CoreCms\Domains\Workflow\Listeners;

use TuranFurkan\CoreCms\Domains\Workflow\Events\WorkflowTransitioned;
use TuranFurkan\CoreCms\Domains\Post\Models\Post;
use TuranFurkan\CoreCms\Domains\Page\Models\Page;

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
