<?php

namespace Tests\Feature\MarketingDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Marketing\Models\MarketingWidget;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WidgetTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        config(['api.keys_enabled' => false]);
    }

    #[Test]
    public function admin_can_crud_widgets(): void
    {
        // 1. Create Widget
        $responseCreate = $this->actingAs($this->admin)
            ->postJson('/api/admin/marketing/widgets', [
                'key' => 'homepage-countdown',
                'type' => 'countdown',
                'config' => ['ends_at' => '2026-12-31T23:59:59Z', 'title' => 'Sale ends in:'],
                'is_active' => true,
            ]);

        $responseCreate->assertStatus(201);
        $responseCreate->assertJsonPath('data.key', 'homepage-countdown');
        $widgetId = $responseCreate->json('data.id');

        // 2. List Widgets
        $responseList = $this->actingAs($this->admin)
            ->getJson('/api/admin/marketing/widgets');
        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');

        // 3. Show Widget
        $responseShow = $this->actingAs($this->admin)
            ->getJson("/api/admin/marketing/widgets/{$widgetId}");
        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.config.title', 'Sale ends in:');

        // 4. Update Widget
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/marketing/widgets/{$widgetId}", [
                'key' => 'homepage-countdown-updated',
                'type' => 'countdown',
                'config' => ['ends_at' => '2026-12-31T23:59:59Z', 'title' => 'Hurry up!'],
                'is_active' => false,
            ]);
        $responseUpdate->assertStatus(200);
        $responseUpdate->assertJsonPath('data.key', 'homepage-countdown-updated');
        $responseUpdate->assertJsonPath('data.config.title', 'Hurry up!');
        $responseUpdate->assertJsonPath('data.is_active', false);

        // 5. Delete Widget
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/marketing/widgets/{$widgetId}");
        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('marketing_widgets', ['id' => $widgetId]);
    }

    #[Test]
    public function public_visitor_can_retrieve_active_widget_by_key(): void
    {
        MarketingWidget::create([
            'key' => 'promo-card',
            'type' => 'newsletter-card',
            'config' => ['title' => 'Subscribe to newsletter!'],
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/marketing/widgets/promo-card');

        $response->assertStatus(200);
        $response->assertJsonPath('data.key', 'promo-card');
        $response->assertJsonPath('data.config.title', 'Subscribe to newsletter!');
    }
}
