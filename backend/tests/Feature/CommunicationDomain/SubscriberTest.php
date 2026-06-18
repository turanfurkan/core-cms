<?php

namespace Tests\Feature\CommunicationDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Communication\Models\Subscriber;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SubscriberTest extends TestCase
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
    public function guest_can_subscribe_to_newsletter(): void
    {
        $response = $this->postJson('/api/subscribers/subscribe', [
            'email' => 'visitor@example.com',
            'consent_given' => true,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.email', 'visitor@example.com');
        $response->assertJsonPath('data.status', 'active');
        $response->assertJsonPath('data.consent_given', true);

        $this->assertDatabaseHas('subscribers', [
            'email' => 'visitor@example.com',
            'status' => 'active',
        ]);
    }

    #[Test]
    public function duplicate_subscribe_updates_status_to_active(): void
    {
        $subscriber = Subscriber::create([
            'email' => 'visitor@example.com',
            'status' => 'unsubscribed',
            'unsubscribed_at' => now(),
        ]);

        $response = $this->postJson('/api/subscribers/subscribe', [
            'email' => 'visitor@example.com',
            'consent_given' => true,
        ]);

        $response->assertStatus(200);
        $subscriber->refresh();
        $this->assertEquals('active', $subscriber->status);
        $this->assertNull($subscriber->unsubscribed_at);
    }

    #[Test]
    public function secure_signed_url_unsubscribe_succeeds(): void
    {
        $subscriber = Subscriber::create([
            'email' => 'visitor@example.com',
            'status' => 'active',
        ]);

        // Generate signed URL
        $unsubscribeUrl = URL::signedRoute(
            'subscribers.unsubscribe',
            ['subscriber' => $subscriber->id]
        );

        // Call the signed URL
        $response = $this->getJson($unsubscribeUrl);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'You have been successfully unsubscribed from our newsletter.');

        $subscriber->refresh();
        $this->assertEquals('unsubscribed', $subscriber->status);
        $this->assertNotNull($subscriber->unsubscribed_at);
    }

    #[Test]
    public function invalid_or_expired_unsubscribe_fails_with_401(): void
    {
        $subscriber = Subscriber::create([
            'email' => 'visitor@example.com',
            'status' => 'active',
        ]);

        // Try tampered signature URL
        $url = route('subscribers.unsubscribe', ['subscriber' => $subscriber->id]) . '?signature=tampered_signature';

        $response = $this->getJson($url);

        $response->assertStatus(401);
        $response->assertJsonPath('error_code', 'COMMUNICATION.INVALID_SIGNATURE');

        $subscriber->refresh();
        $this->assertEquals('active', $subscriber->status);
    }

    #[Test]
    public function admin_can_crud_subscribers(): void
    {
        // 1. Create Subscriber
        $responseCreate = $this->actingAs($this->admin)
            ->postJson('/api/admin/subscribers', [
                'email' => 'manual@example.com',
                'status' => 'pending',
                'consent_given' => false,
            ]);

        $responseCreate->assertStatus(201);
        $responseCreate->assertJsonPath('data.email', 'manual@example.com');
        $subscriberId = $responseCreate->json('data.id');

        // 2. List Subscribers
        $responseList = $this->actingAs($this->admin)
            ->getJson('/api/admin/subscribers?status=pending');
        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');

        // 3. Show Subscriber
        $responseShow = $this->actingAs($this->admin)
            ->getJson("/api/admin/subscribers/{$subscriberId}");
        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.email', 'manual@example.com');

        // 4. Update Subscriber
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/subscribers/{$subscriberId}", [
                'email' => 'manual-updated@example.com',
                'status' => 'active',
                'consent_given' => true,
            ]);
        $responseUpdate->assertStatus(200);
        $responseUpdate->assertJsonPath('data.email', 'manual-updated@example.com');
        $responseUpdate->assertJsonPath('data.status', 'active');

        // 5. Delete Subscriber
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/subscribers/{$subscriberId}");
        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('subscribers', ['id' => $subscriberId]);
    }
}
