<?php

namespace Tests\Feature\MarketingDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Marketing\Models\MarketingPromotion;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PromotionTest extends TestCase
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
    public function admin_can_crud_promotions(): void
    {
        // 1. Create Promotion
        $responseCreate = $this->actingAs($this->admin)
            ->postJson('/api/admin/marketing/promotions', [
                'name' => 'Winter Sale Banner',
                'type' => 'banner',
                'content' => ['title' => 'Get 50% Off!', 'color' => '#ff0000'],
                'rules' => ['paths' => ['/shop/*']],
                'is_active' => true,
            ]);

        $responseCreate->assertStatus(201);
        $responseCreate->assertJsonPath('data.name', 'Winter Sale Banner');
        $promotionId = $responseCreate->json('data.id');

        // 2. List Promotions
        $responseList = $this->actingAs($this->admin)
            ->getJson('/api/admin/marketing/promotions');
        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');

        // 3. Show Promotion
        $responseShow = $this->actingAs($this->admin)
            ->getJson("/api/admin/marketing/promotions/{$promotionId}");
        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.content.title', 'Get 50% Off!');

        // 4. Update Promotion
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/marketing/promotions/{$promotionId}", [
                'name' => 'Winter Sale Banner Updated',
                'type' => 'banner',
                'content' => ['title' => 'Get 60% Off!', 'color' => '#ffffff'],
                'rules' => ['paths' => ['/shop/*']],
                'is_active' => false,
            ]);
        $responseUpdate->assertStatus(200);
        $responseUpdate->assertJsonPath('data.name', 'Winter Sale Banner Updated');
        $responseUpdate->assertJsonPath('data.is_active', false);

        // 5. Delete Promotion
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/marketing/promotions/{$promotionId}");
        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('marketing_promotions', ['id' => $promotionId]);
    }

    #[Test]
    public function public_visitor_can_retrieve_promotions_by_matching_path(): void
    {
        // Active promotion targeting shop pages
        MarketingPromotion::create([
            'name' => 'Shop Banner',
            'type' => 'banner',
            'content' => ['title' => 'Shop Promotion'],
            'rules' => ['paths' => ['/shop', '/shop/*']],
            'is_active' => true,
        ]);

        // Active promotion targeting blog pages
        MarketingPromotion::create([
            'name' => 'Blog Banner',
            'type' => 'banner',
            'content' => ['title' => 'Blog Promotion'],
            'rules' => ['paths' => ['/blog/*']],
            'is_active' => true,
        ]);

        // Inactive promotion
        MarketingPromotion::create([
            'name' => 'Global Popup Inactive',
            'type' => 'popup',
            'content' => ['title' => 'Inactive Popup'],
            'rules' => ['paths' => ['*']],
            'is_active' => false,
        ]);

        // Retrieve promotions without path parameter (should return all active promotions)
        $responseAll = $this->getJson('/api/marketing/promotions');
        $responseAll->assertStatus(200);
        $responseAll->assertJsonCount(2, 'data');

        // Retrieve promotions for shop path
        $responseShop = $this->getJson('/api/marketing/promotions?path=/shop/subpage');
        $responseShop->assertStatus(200);
        $responseShop->assertJsonCount(1, 'data');
        $responseShop->assertJsonPath('data.0.name', 'Shop Banner');

        // Retrieve promotions for blog path
        $responseBlog = $this->getJson('/api/marketing/promotions?path=/blog/slug-title');
        $responseBlog->assertStatus(200);
        $responseBlog->assertJsonCount(1, 'data');
        $responseBlog->assertJsonPath('data.0.name', 'Blog Banner');
    }
}
