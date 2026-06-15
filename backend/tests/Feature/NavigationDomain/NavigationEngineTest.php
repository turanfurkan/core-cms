<?php

namespace Tests\Feature\NavigationDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Navigation\Models\Navigation;
use App\Domains\Navigation\Models\NavigationItem;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NavigationEngineTest extends TestCase
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
    public function admin_can_manage_navigations_and_nested_items(): void
    {
        // 1. Create Menu with nested tree
        $response1 = $this->actingAs($this->admin)
            ->postJson('/api/admin/navigations', [
                'name' => 'Main Menu',
                'key' => 'main-menu',
                'is_active' => true,
                'items' => [
                    [
                        'title' => ['tr' => 'Anasayfa', 'en' => 'Home'],
                        'type' => 'custom',
                        'url' => '/',
                        'target' => '_self',
                        'is_active' => true,
                        'children' => []
                    ],
                    [
                        'title' => ['tr' => 'Kurumsal', 'en' => 'Corporate'],
                        'type' => 'custom',
                        'url' => '/corporate',
                        'target' => '_self',
                        'is_active' => true,
                        'children' => [
                            [
                                'title' => ['tr' => 'Hakkımızda', 'en' => 'About Us'],
                                'type' => 'custom',
                                'url' => '/about-us',
                                'target' => '_self',
                                'is_active' => true,
                                'children' => []
                            ]
                        ]
                    ]
                ]
            ]);

        $response1->assertStatus(201);
        $response1->assertJsonPath('data.name', 'Main Menu');
        $this->assertDatabaseHas('navigations', ['key' => 'main-menu']);
        
        $navigationId = $response1->json('data.id');

        // Verify nested structure saved in database
        $this->assertDatabaseHas('navigation_items', ['title->tr' => 'Anasayfa', 'parent_id' => null]);
        $corporateItem = NavigationItem::where('title->tr', 'Kurumsal')->first();
        $this->assertNotNull($corporateItem);
        $this->assertDatabaseHas('navigation_items', ['title->tr' => 'Hakkımızda', 'parent_id' => $corporateItem->id]);

        // 2. Update Menu Structure
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/navigations/{$navigationId}", [
                'name' => 'Main Menu Updated',
                'key' => 'main-menu',
                'is_active' => true,
                'items' => [
                    [
                        'title' => ['tr' => 'Anasayfa Güncel', 'en' => 'Home Updated'],
                        'type' => 'custom',
                        'url' => '/',
                        'target' => '_self',
                        'is_active' => true,
                        'children' => []
                    ]
                ]
            ]);

        $responseUpdate->assertStatus(200);
        $this->assertDatabaseHas('navigations', ['name' => 'Main Menu Updated']);
        $this->assertDatabaseMissing('navigation_items', ['title->tr' => 'Kurumsal']);
        $this->assertDatabaseHas('navigation_items', ['title->tr' => 'Anasayfa Güncel']);

        // 3. Delete Menu
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/navigations/{$navigationId}");

        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('navigations', ['id' => $navigationId]);
        $this->assertDatabaseMissing('navigation_items', ['navigation_id' => $navigationId]);
    }

    #[Test]
    public function public_navigation_loads_recursive_items_and_caches_results(): void
    {
        Cache::clear();

        $navigation = Navigation::create([
            'name' => 'Sidebar Nav',
            'key' => 'sidebar',
            'is_active' => true,
        ]);

        $root = $navigation->items()->create([
            'title' => ['tr' => 'Destek', 'en' => 'Support'],
            'type' => 'custom',
            'url' => '/support',
            'parent_id' => null,
            'order' => 1,
        ]);

        $child = $navigation->items()->create([
            'title' => ['tr' => 'SSS', 'en' => 'FAQ'],
            'type' => 'custom',
            'url' => '/faq',
            'parent_id' => $root->id,
            'order' => 1,
        ]);

        $cacheKey = "navigations.sidebar";

        // Assert cache is empty first
        $this->assertFalse(Cache::has($cacheKey));

        // 1. Load via public endpoint
        $response = $this->getJson('/api/navigations/sidebar');
        $response->assertStatus(200);
        $response->assertJsonPath('data.items.0.title.tr', 'Destek');
        $response->assertJsonPath('data.items.0.children.0.title.tr', 'SSS');

        // Assert menu is now cached
        $this->assertTrue(Cache::has($cacheKey));

        // 2. Perform admin update, should bust the cache
        $this->actingAs($this->admin)
            ->putJson("/api/admin/navigations/{$navigation->id}", [
                'name' => 'Sidebar Nav Updated',
                'key' => 'sidebar',
                'is_active' => true,
                'items' => [
                    [
                        'title' => ['tr' => 'Destek Güncel', 'en' => 'Support Updated'],
                        'type' => 'custom',
                        'url' => '/support-new',
                        'children' => []
                    ]
                ]
            ]);

        // Assert cache is flushed
        $this->assertFalse(Cache::has($cacheKey));
    }
}
