<?php

namespace App\Domains\Integration\Listeners;

use App\Domains\Identity\Events\UserRegistered;
use App\Domains\Forms\Events\FormSubmitted;
use App\Domains\Workflow\Events\WorkflowTransitioned;
use App\Domains\Integration\Models\Webhook;
use App\Domains\Integration\Jobs\DispatchWebhookJob;

class WebhookEventListener
{
    public function handle(mixed $event): void
    {
        $eventName = null;
        $payload = [];

        if ($event instanceof UserRegistered) {
            $eventName = 'user.registered';
            $payload = [
                'id' => $event->user->id,
                'name' => $event->user->name,
                'email' => $event->user->email,
                'phone' => $event->user->phone,
                'created_at' => $event->user->created_at->toIso8601String(),
            ];
        } elseif ($event instanceof FormSubmitted) {
            $eventName = 'form.submitted';
            $payload = [
                'id' => $event->submission->id,
                'form_id' => $event->submission->form_id,
                'form_slug' => $event->submission->form->slug,
                'data' => $event->submission->data,
                'created_at' => $event->submission->created_at->toIso8601String(),
            ];
        } elseif ($event instanceof WorkflowTransitioned) {
            $log = $event->log;
            $model = $log->workflowable;
            $toState = $log->toState;

            if ($toState && $toState->is_final && $toState->code === 'approved') {
                if ($model instanceof \App\Domains\Post\Models\Post) {
                    $eventName = 'post.published';
                    $payload = [
                        'id' => $model->id,
                        'title' => $model->title,
                        'slug' => $model->slug,
                        'published_at' => now()->toIso8601String(),
                    ];
                } elseif ($model instanceof \App\Domains\Page\Models\Page) {
                    $eventName = 'page.published';
                    $payload = [
                        'id' => $model->id,
                        'title' => $model->title,
                        'slug' => $model->slug,
                        'published_at' => now()->toIso8601String(),
                    ];
                }
            }
        }

        if ($eventName) {
            $this->dispatchWebhooks($eventName, $payload);
        }
    }

    protected function dispatchWebhooks(string $eventName, array $payload): void
    {
        $webhooks = Webhook::where('is_active', true)
            ->whereJsonContains('events', $eventName)
            ->get();

        foreach ($webhooks as $webhook) {
            dispatch(new DispatchWebhookJob($webhook, $eventName, $payload));
        }
    }
}
