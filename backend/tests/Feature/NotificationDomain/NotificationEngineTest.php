<?php

namespace Tests\Feature\NotificationDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Identity\Contracts\SmsGateway;
use App\Domains\Notification\Models\NotificationTemplate;
use App\Domains\Notification\Support\DynamicNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NotificationEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->user = User::factory()->create([
            'phone' => '+905555555555',
        ]);
    }

    #[Test]
    public function admin_can_manage_notification_templates(): void
    {
        // 1. Create Template
        $response1 = $this->actingAs($this->admin)
            ->postJson('/api/admin/notification-templates', [
                'code' => 'welcome_email',
                'name' => 'Welcome Email Template',
                'channels' => ['mail', 'database'],
                'subject' => 'Welcome {{name}}!',
                'content' => [
                    'mail' => 'Hello {{name}}, welcome to CoreCMS.',
                    'database' => 'Welcome aboard, {{name}}!',
                ],
                'is_active' => true,
            ]);

        $response1->assertStatus(201);
        $response1->assertJsonPath('data.code', 'welcome_email');
        $this->assertDatabaseHas('notification_templates', ['code' => 'welcome_email']);

        $templateId = $response1->json('data.id');

        // 2. Update Template
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/notification-templates/{$templateId}", [
                'code' => 'welcome_email_updated',
                'name' => 'Welcome Email Template Updated',
                'channels' => ['mail', 'database', 'sms'],
                'subject' => 'Welcome home {{name}}!',
                'content' => [
                    'mail' => 'Hello {{name}}, welcome to our platform.',
                    'database' => 'Welcome home, {{name}}!',
                    'sms' => 'Welcome home {{name}}',
                ],
                'is_active' => true,
            ]);

        $responseUpdate->assertStatus(200);
        $this->assertDatabaseHas('notification_templates', ['code' => 'welcome_email_updated']);

        // 3. Delete Template
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/notification-templates/{$templateId}");

        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('notification_templates', ['id' => $templateId]);
    }

    #[Test]
    public function dynamic_notifications_dispatch(): void
    {
        Notification::fake();

        // Mock SMS Gateway
        $smsGatewayMock = $this->createMock(SmsGateway::class);
        $smsGatewayMock->expects($this->never()) // Notification is faked, SMS will not run
            ->method('send');
        $this->app->instance(SmsGateway::class, $smsGatewayMock);

        // Define dynamic template in database
        NotificationTemplate::create([
            'code' => 'user_auth_otp',
            'name' => 'OTP Code Alert',
            'channels' => ['mail', 'database', 'sms'],
            'subject' => 'Verification Code: {{code}}',
            'content' => [
                'mail' => 'Hello {{name}}, your login code is {{code}}.',
                'database' => 'Verification code sent: {{code}}',
                'sms' => 'Your OTP is {{code}}',
            ],
            'is_active' => true,
        ]);

        // Trigger notification
        $this->user->notify(new DynamicNotification('user_auth_otp', [
            'name' => 'Furkan',
            'code' => '123456',
        ]));

        Notification::assertSentTo(
            $this->user,
            DynamicNotification::class,
            function ($notification, $channels) {
                return $notification->templateCode === 'user_auth_otp'
                    && in_array('mail', $channels)
                    && in_array('database', $channels);
            }
        );
    }

    #[Test]
    public function user_notifications_api_management(): void
    {
        // Manually create a notification record in the DB
        $notificationId = (string) Str::uuid();
        $this->user->notifications()->create([
            'id' => $notificationId,
            'type' => DynamicNotification::class,
            'data' => [
                'template_code' => 'user_auth_otp',
                'title' => 'OTP Code Alert',
                'message' => 'Verification code sent: 123456',
            ],
        ]);

        // 1. Get user notifications list
        $responseList = $this->actingAs($this->user)
            ->getJson('/api/profile/notifications');

        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');
        $responseList->assertJsonPath('data.0.id', $notificationId);

        // 2. Mark notification as read
        $responseRead = $this->actingAs($this->user)
            ->patchJson("/api/profile/notifications/{$notificationId}/read");

        $responseRead->assertStatus(200);
        $this->assertNotNull($this->user->fresh()->notifications()->first()->read_at);

        // 3. Mark all notifications as read
        $responseReadAll = $this->actingAs($this->user)
            ->postJson("/api/profile/notifications/read-all");
        $responseReadAll->assertStatus(200);

        // 4. Delete notification
        $responseDelete = $this->actingAs($this->user)
            ->deleteJson("/api/profile/notifications/{$notificationId}");

        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('notifications', ['id' => $notificationId]);
    }
}
