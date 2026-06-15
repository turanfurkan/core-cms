<?php

namespace Tests\Feature\IntegrationDomain;

use App\Domains\Identity\Events\UserRegistered;
use App\Domains\Identity\Models\User;
use App\Domains\Forms\Events\FormSubmitted;
use App\Domains\Forms\Models\Form;
use App\Domains\Forms\Models\FormSubmission;
use App\Domains\Workflow\Events\WorkflowTransitioned;
use App\Domains\Workflow\Models\WorkflowLog;
use App\Domains\Workflow\Models\WorkflowState;
use App\Domains\Content\Models\ContentEntry;
use App\Domains\Content\Models\ContentType;
use App\Domains\Integration\Models\Webhook;
use App\Domains\Integration\Models\WebhookLog;
use App\Domains\Integration\Jobs\DispatchWebhookJob;
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
    public function workflow_transitioned_event_dispatches_content_published_webhook_job(): void
    {
        Queue::fake();

        $webhook = Webhook::create([
            'name' => 'Publish Webhook',
            'url' => 'https://example.com/content-published',
            'events' => ['content.published'],
            'is_active' => true,
        ]);

        $contentType = new ContentType([
            'name' => 'Blog Post',
            'slug' => 'blog-post',
        ]);
        $contentType->id = 2;

        $entry = new ContentEntry([
            'content_type_id' => 2,
            'data' => [],
        ]);
        $entry->id = 10;
        $entry->setRelation('contentType', $contentType);
        $entry->setAttribute('slug', 'hello-world');
        $entry->setAttribute('values', ['title' => 'Hello World', 'content' => 'Lorem ipsum']);

        $state = new WorkflowState([
            'code' => 'approved',
            'is_final' => true,
        ]);
        $state->id = 3;

        $log = new WorkflowLog();
        $log->setRelation('workflowable', $entry);
        $log->setRelation('toState', $state);

        event(new WorkflowTransitioned($log));

        Queue::assertPushed(DispatchWebhookJob::class, function ($job) use ($webhook) {
            return $job->webhook->id === $webhook->id
                && $job->event === 'content.published'
                && $job->payload['id'] === 10
                && $job->payload['slug'] === 'hello-world'
                && $job->payload['content_type'] === 'blog-post';
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
