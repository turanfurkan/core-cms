<?php

namespace Tests\Feature\CommunicationDomain;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Communication\Models\Campaign;
use TuranFurkan\CoreCms\Domains\Communication\Models\Subscriber;
use TuranFurkan\CoreCms\Domains\Notification\Models\NotificationTemplate;
use TuranFurkan\CoreCms\Domains\Notification\Support\DynamicNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CampaignTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected NotificationTemplate $template;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->template = NotificationTemplate::create([
            'code' => 'newsletter_default',
            'name' => 'Default Newsletter',
            'channels' => ['mail'],
            'subject' => 'Weekly Update',
            'content' => ['mail' => 'Hello! Unsubscribe here: {{unsubscribe_url}}'],
            'is_active' => true,
        ]);
    }

    #[Test]
    public function admin_can_crud_campaigns(): void
    {
        // 1. Create Campaign
        $responseCreate = $this->actingAs($this->admin)
            ->postJson('/api/admin/campaigns', [
                'name' => 'Summer Deals',
                'template_code' => 'newsletter_default',
                'scheduled_at' => now()->addDay()->toIso8601String(),
            ]);

        $responseCreate->assertStatus(201);
        $responseCreate->assertJsonPath('data.name', 'Summer Deals');
        $responseCreate->assertJsonPath('data.status', 'draft');
        $campaignId = $responseCreate->json('data.id');

        // 2. List Campaigns
        $responseList = $this->actingAs($this->admin)
            ->getJson('/api/admin/campaigns');
        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');

        // 3. Show Campaign
        $responseShow = $this->actingAs($this->admin)
            ->getJson("/api/admin/campaigns/{$campaignId}");
        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.name', 'Summer Deals');

        // 4. Delete Campaign
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/campaigns/{$campaignId}");
        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('campaigns', ['id' => $campaignId]);
    }

    #[Test]
    public function triggering_send_dispatches_queue_job(): void
    {
        Queue::fake();

        $campaign = Campaign::create([
            'name' => 'Promo Campaign',
            'template_code' => 'newsletter_default',
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/campaigns/{$campaign->id}/send");

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'sending');

        Queue::assertPushed(\TuranFurkan\CoreCms\Domains\Communication\Jobs\SendCampaignJob::class, function ($job) use ($campaign) {
            return $job->campaign->id === $campaign->id;
        });
    }

    #[Test]
    public function send_campaign_job_sends_notifications_to_active_subscribers(): void
    {
        Notification::fake();

        // Active subscriber
        $sub1 = Subscriber::create([
            'email' => 'active1@example.com',
            'status' => 'active',
        ]);

        // Unsubscribed subscriber
        $sub2 = Subscriber::create([
            'email' => 'unsubscribed@example.com',
            'status' => 'unsubscribed',
        ]);

        $campaign = Campaign::create([
            'name' => 'System Updates',
            'template_code' => 'newsletter_default',
            'status' => 'draft',
        ]);

        // Execute the job synchronously
        $job = new \TuranFurkan\CoreCms\Domains\Communication\Jobs\SendCampaignJob($campaign);
        $job->handle();

        $campaign->refresh();
        $this->assertEquals('sent', $campaign->status);
        $this->assertNotNull($campaign->sent_at);
        $this->assertEquals(1, $campaign->summary['total']);
        $this->assertEquals(1, $campaign->summary['success']); // only active1
        $this->assertEquals(0, $campaign->summary['failed']);

        // Assert notification sent to active subscriber
        Notification::assertSentTo($sub1, DynamicNotification::class, function ($notification) {
            return $notification->templateCode === 'newsletter_default'
                && str_contains($notification->variables['unsubscribe_url'], '/api/subscribers/unsubscribe/');
        });

        // Assert notification NOT sent to unsubscribed subscriber
        Notification::assertNotSentTo($sub2, DynamicNotification::class);
    }
}
