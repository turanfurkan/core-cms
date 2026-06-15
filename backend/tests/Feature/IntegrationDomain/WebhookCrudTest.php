<?php

namespace Tests\Feature\IntegrationDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Integration\Models\Webhook;
use App\Domains\Integration\Models\WebhookLog;
use Database\Seeders\RolesAndPermissionsSeeder;
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
}
