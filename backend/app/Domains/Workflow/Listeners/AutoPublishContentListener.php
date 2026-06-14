<?php

namespace App\Domains\Workflow\Listeners;

use App\Domains\Workflow\Events\WorkflowTransitioned;
use App\Domains\Content\Models\ContentEntry;
use App\Domains\Content\Support\ContentCacheHelper;

class AutoPublishContentListener
{
    public function handle(WorkflowTransitioned $event): void
    {
        $log = $event->log;
        $model = $log->workflowable;

        if ($model instanceof ContentEntry) {
            $toState = $log->toState;
            
            if ($toState && $toState->is_final && $toState->code === 'approved') {
                $model->update([
                    'status' => ContentEntry::STATUS_PUBLISHED,
                    'published_at' => now(),
                ]);

                // Invalidate delivery caches for this content type slug
                if ($model->contentType) {
                    ContentCacheHelper::invalidate($model->contentType->slug);
                }
            }
        }
    }
}
