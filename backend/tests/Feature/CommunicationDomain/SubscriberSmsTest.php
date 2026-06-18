<?php

namespace Tests\Feature\CommunicationDomain;

use App\Domains\Identity\Contracts\SmsGateway;
use App\Domains\Identity\Models\User;
use App\Domains\Communication\Models\Campaign;
use App\Domains\Communication\Models\Subscriber;
use App\Domains\Notification\Models\NotificationTemplate;
use App\Domains\Notification\Support\DynamicNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SubscriberSmsTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected NotificationTemplate $smsTemplate;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->smsTemplate = NotificationTemplate::create([
            'code' => 'sms_alert_default',
            'name' => 'Default SMS Alert',
            'channels' => ['sms'],
            'subject' => 'SMS Campaign',
            'content' => ['sms' => 'Alert details: {{unsubscribe_url}}'],
            'is_active' => true,
        ]);
    }

    #[Test]
    public function visitor_can_subscribe_with_phone_number_only(): void
    {
        $response = $this->postJson('/api/subscribers/subscribe', [
            'phone' => '+905554443322',
            'consent_given' => true,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.phone', '+905554443322');
        $response->assertJsonPath('data.email', null);

        $this->assertDatabaseHas('subscribers', [
            'phone' => '+905554443322',
            'status' => 'active',
        ]);
    }

    #[Test]
    public function subscribe_fails_if_both_email_and_phone_are_missing(): void
    {
        $response = $this->postJson('/api/subscribers/subscribe', [
            'consent_given' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email', 'phone']);
    }

    #[Test]
    public function bulk_campaign_sends_sms_notifications(): void
    {
        Notification::fake();

        // Phone subscriber
        $sub1 = Subscriber::create([
            'phone' => '+905551112233',
            'status' => 'active',
        ]);

        // Email subscriber
        $sub2 = Subscriber::create([
            'email' => 'emailonly@example.com',
            'status' => 'active',
        ]);

        $campaign = Campaign::create([
            'name' => 'Flash Sale SMS',
            'template_code' => 'sms_alert_default',
            'status' => 'draft',
        ]);

        // Execute the job synchronously
        $job = new \App\Domains\Communication\Jobs\SendCampaignJob($campaign);
        $job->handle();

        $campaign->refresh();
        $this->assertEquals('sent', $campaign->status);

        // Assert SMS notification sent to $sub1
        Notification::assertSentTo($sub1, DynamicNotification::class, function ($notification) {
            return $notification->templateCode === 'sms_alert_default'
                && str_contains($notification->variables['unsubscribe_url'], '/api/subscribers/unsubscribe/');
        });

        // Assert notification sent to $sub2 (via DynamicNotification, but it has sms channel and $sub2 has no phone number, so SmsChannel will skip it)
        Notification::assertSentTo($sub2, DynamicNotification::class);
    }
}
