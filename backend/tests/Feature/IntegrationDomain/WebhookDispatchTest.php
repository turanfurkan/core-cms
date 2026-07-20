<?php

namespace Tests\Feature\IntegrationDomain;

use TuranFurkan\CoreCms\Domains\Identity\Events\UserRegistered;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Forms\Events\FormSubmitted;
use TuranFurkan\CoreCms\Domains\Forms\Models\Form;
use TuranFurkan\CoreCms\Domains\Forms\Models\FormSubmission;
use TuranFurkan\CoreCms\Domains\Workflow\Events\WorkflowTransitioned;
use TuranFurkan\CoreCms\Domains\Workflow\Models\WorkflowLog;
use TuranFurkan\CoreCms\Domains\Workflow\Models\WorkflowState;
use TuranFurkan\CoreCms\Domains\Post\Models\Post;
use TuranFurkan\CoreCms\Domains\Integration\Models\Webhook;
use TuranFurkan\CoreCms\Domains\Integration\Models\WebhookLog;
use TuranFurkan\CoreCms\Domains\Integration\Jobs\DispatchWebhookJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WebhookDispatchTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function user_registered_event_dispatches_webhook_job(): void
    {
        Queue::fake();

        $webhook = Webhook::create([
            'name' => 'User Webhook',
            'url' => 'https://example.com/user-registered',
            'events' => ['user.registered'],
            'is_active' => true,
        ]);

        $user = User::factory()->make([
            'id' => 123,
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '1234567890',
        ]);
        $user->created_at = now();
        
        event(new UserRegistered($user));

        Queue::assertPushed(DispatchWebhookJob::class, function ($job) use ($webhook) {
            return $job->webhook->id === $webhook->id
                && $job->event === 'user.registered'
                && $job->payload['id'] === 123
                && $job->payload['name'] === 'John Doe';
        });
    }

    #[Test]
    public function form_submitted_event_dispatches_webhook_job(): void
    {
        Queue::fake();

        $webhook = Webhook::create([
            'name' => 'Form Webhook',
            'url' => 'https://example.com/form-submitted',
            'events' => ['form.submitted'],
            'is_active' => true,
        ]);

        $form = new Form([
            'name' => 'Contact Us',
            'slug' => 'contact-us',
        ]);
        $form->id = 1;

        $submission = new FormSubmission([
            'form_id' => 1,
            'data' => ['name' => 'John Doe', 'message' => 'Hello'],
        ]);
        $submission->id = 5;
        $submission->created_at = now();
        $submission->setRelation('form', $form);

        event(new FormSubmitted($submission));

        Queue::assertPushed(DispatchWebhookJob::class, function ($job) use ($webhook) {
            return $job->webhook->id === $webhook->id
                && $job->event === 'form.submitted'
                && $job->payload['id'] === 5
                && $job->payload['form_slug'] === 'contact-us';
        });
    }

    #[Test]
    public function workflow_transitioned_event_dispatches_post_published_webhook_job(): void
    {
        Queue::fake();

        $webhook = Webhook::create([
            'name' => 'Publish Webhook',
            'url' => 'https://example.com/post-published',
            'events' => ['post.published'],
            'is_active' => true,
        ]);

        $post = new Post([
            'title' => ['tr' => 'Hello World', 'en' => 'Hello World'],
            'slug' => ['tr' => 'hello-world', 'en' => 'hello-world'],
            'content' => ['tr' => 'Lorem ipsum', 'en' => 'Lorem ipsum'],
            'summary' => ['tr' => 'Summary', 'en' => 'Summary'],
        ]);
        $post->id = 10;

        $state = new WorkflowState([
            'code' => 'approved',
            'is_final' => true,
        ]);
        $state->id = 3;

        $log = new WorkflowLog();
        $log->setRelation('workflowable', $post);
        $log->setRelation('toState', $state);

        event(new WorkflowTransitioned($log));

        Queue::assertPushed(DispatchWebhookJob::class, function ($job) use ($webhook) {
            return $job->webhook->id === $webhook->id
                && $job->event === 'post.published'
                && $job->payload['id'] === 10
                && $job->payload['slug']['tr'] === 'hello-world';
        });
    }

    #[Test]
    public function dispatch_webhook_job_sends_http_post_request_and_logs_execution(): void
    {
        Http::fake([
            'https://example.com/webhook' => Http::response('OK', 200),
        ]);

        $webhook = Webhook::create([
            'name' => 'Dispatch Webhook',
            'url' => 'https://example.com/webhook',
            'events' => ['user.registered'],
            'secret' => 'my-secret-key',
            'headers' => ['Authorization' => 'Bearer token123'],
            'is_active' => true,
        ]);

        $payload = ['id' => 1, 'email' => 'test@example.com'];

        $job = new DispatchWebhookJob($webhook, 'user.registered', $payload);
        $job->handle();

        Http::assertSent(function ($request) use ($payload) {
            $expectedSignature = hash_hmac('sha256', json_encode($payload), 'my-secret-key');
            return $request->url() === 'https://example.com/webhook'
                && $request->method() === 'POST'
                && $request->hasHeader('Authorization', 'Bearer token123')
                && $request->hasHeader('X-CoreCMS-Signature', $expectedSignature)
                && $request['id'] === 1;
        });

        $this->assertDatabaseHas('integrations_webhook_logs', [
            'webhook_id' => $webhook->id,
            'event' => 'user.registered',
            'response_status' => 200,
            'response_body' => 'OK',
        ]);
    }
}
