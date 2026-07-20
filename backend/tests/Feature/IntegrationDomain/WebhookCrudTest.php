<?php

namespace Tests\Feature\IntegrationDomain;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Integration\Models\Webhook;
use TuranFurkan\CoreCms\Domains\Integration\Models\WebhookLog;
use TuranFurkan\CoreCms\Domains\Integration\Jobs\DispatchWebhookJob;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WebhookCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    #[Test]
    public function admin_can_manage_webhooks_crud(): void
    {
        // 1. Create a Webhook
        $responseCreate = $this->actingAs($this->admin)
            ->postJson('/api/admin/webhooks', [
                'name' => 'Test Webhook',
                'url' => 'https://example.com/webhook',
                'events' => ['user.registered', 'form.submitted'],
                'secret' => 'supersecret',
                'headers' => ['Authorization' => 'Bearer token123'],
                'is_active' => true,
            ]);

        $responseCreate->assertStatus(201);
        $responseCreate->assertJsonPath('data.name', 'Test Webhook');
        $responseCreate->assertJsonPath('data.url', 'https://example.com/webhook');
        $responseCreate->assertJsonPath('data.events', ['user.registered', 'form.submitted']);
        
        $webhookId = $responseCreate->json('data.id');
        $this->assertDatabaseHas('integrations_webhooks', [
            'id' => $webhookId,
            'name' => 'Test Webhook',
            'url' => 'https://example.com/webhook',
        ]);

        // 2. List Webhooks
        $responseList = $this->actingAs($this->admin)
            ->getJson('/api/admin/webhooks');

        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');

        // 3. Show Webhook
        $responseShow = $this->actingAs($this->admin)
            ->getJson("/api/admin/webhooks/{$webhookId}");

        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.name', 'Test Webhook');

        // 4. Update Webhook
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/webhooks/{$webhookId}", [
                'name' => 'Updated Webhook',
                'url' => 'https://example.com/webhook-updated',
                'events' => ['content.published'],
                'secret' => 'newsecret',
                'headers' => ['X-Custom' => 'Value'],
                'is_active' => false,
            ]);

        $responseUpdate->assertStatus(200);
        $responseUpdate->assertJsonPath('data.name', 'Updated Webhook');
        $responseUpdate->assertJsonPath('data.is_active', false);
        $this->assertDatabaseHas('integrations_webhooks', [
            'id' => $webhookId,
            'name' => 'Updated Webhook',
            'url' => 'https://example.com/webhook-updated',
            'is_active' => 0,
        ]);

        // 5. Delete Webhook
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/webhooks/{$webhookId}");

        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('integrations_webhooks', ['id' => $webhookId]);
    }

    #[Test]
    public function admin_can_view_webhook_logs(): void
    {
        $webhook = Webhook::create([
            'name' => 'Log Webhook',
            'url' => 'https://example.com/webhook',
            'events' => ['user.registered'],
            'is_active' => true,
        ]);

        WebhookLog::create([
            'webhook_id' => $webhook->id,
            'event' => 'user.registered',
            'payload' => ['id' => 1],
            'response_status' => 200,
            'response_body' => 'Success',
            'duration_ms' => 150,
        ]);

        $responseLogs = $this->actingAs($this->admin)
            ->getJson("/api/admin/webhooks/{$webhook->id}/logs");

        $responseLogs->assertStatus(200);
        $responseLogs->assertJsonCount(1, 'data');
        $responseLogs->assertJsonPath('data.0.response_status', 200);
        $responseLogs->assertJsonPath('data.0.response_body', 'Success');
    }

    #[Test]
    public function validation_fails_for_invalid_webhook_data(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/webhooks', [
                'name' => '',
                'url' => 'invalid-url',
                'events' => ['invalid.event'],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'url', 'events.0']);
    }

    #[Test]
    public function admin_can_test_webhook_connection(): void
    {
        Http::fake([
            'https://example.com/ping' => Http::response('Handshake Successful', 200),
        ]);

        $webhook = Webhook::create([
            'name' => 'Test Webhook Connection',
            'url' => 'https://example.com/ping',
            'events' => ['user.registered'],
            'secret' => 'supersecret',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/webhooks/{$webhook->id}/test");

        $response->assertStatus(200);
        $response->assertJsonPath('data.event', 'webhook.test');
        $response->assertJsonPath('data.response_status', 200);
        $response->assertJsonPath('data.response_body', 'Handshake Successful');

        $this->assertDatabaseHas('integrations_webhook_logs', [
            'webhook_id' => $webhook->id,
            'event' => 'webhook.test',
            'response_status' => 200,
            'response_body' => 'Handshake Successful',
        ]);
    }

    #[Test]
    public function admin_can_retry_webhook_log(): void
    {
        Queue::fake();

        $webhook = Webhook::create([
            'name' => 'Retry Webhook',
            'url' => 'https://example.com/webhook',
            'events' => ['user.registered'],
            'is_active' => true,
        ]);

        $log = WebhookLog::create([
            'webhook_id' => $webhook->id,
            'event' => 'user.registered',
            'payload' => ['user_id' => 99, 'email' => 'retry@example.com'],
            'response_status' => 500,
            'response_body' => 'Internal Server Error',
            'duration_ms' => 300,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/webhooks/{$webhook->id}/logs/{$log->id}/retry");

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Webhook delivery re-queued successfully.');

        Queue::assertPushed(DispatchWebhookJob::class, function ($job) use ($webhook, $log) {
            return $job->webhook->id === $webhook->id
                && $job->event === 'user.registered'
                && $job->payload === $log->payload;
        });
    }
}
