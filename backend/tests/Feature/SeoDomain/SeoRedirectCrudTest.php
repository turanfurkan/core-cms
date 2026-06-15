<?php

namespace Tests\Feature\SeoDomain;

use App\Domains\Identity\Models\User;
use App\Domains\SEO\Models\SeoRedirect;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SeoRedirectCrudTest extends TestCase
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
    public function admin_can_manage_seo_redirects_crud(): void
    {
        // 1. Create redirect rule
        $responseCreate = $this->actingAs($this->admin)
            ->postJson('/api/admin/seo/redirects', [
                'source_path' => '/old-contact',
                'target_path' => '/contact',
                'status_code' => 301,
                'is_active' => true,
            ]);

        $responseCreate->assertStatus(201);
        $responseCreate->assertJsonPath('data.source_path', '/old-contact');
        $responseCreate->assertJsonPath('data.target_path', '/contact');
        $responseCreate->assertJsonPath('data.status_code', 301);

        $redirectId = $responseCreate->json('data.id');
        $this->assertDatabaseHas('seo_redirects', [
            'id' => $redirectId,
            'source_path' => '/old-contact',
            'target_path' => '/contact',
        ]);

        // 2. List redirect rules
        $responseList = $this->actingAs($this->admin)
            ->getJson('/api/admin/seo/redirects');

        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');

        // 3. Show redirect rule
        $responseShow = $this->actingAs($this->admin)
            ->getJson("/api/admin/seo/redirects/{$redirectId}");

        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.source_path', '/old-contact');

        // 4. Update redirect rule
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/seo/redirects/{$redirectId}", [
                'source_path' => '/older-contact',
                'target_path' => '/new-contact',
                'status_code' => 302,
                'is_active' => false,
            ]);

        $responseUpdate->assertStatus(200);
        $responseUpdate->assertJsonPath('data.source_path', '/older-contact');
        $responseUpdate->assertJsonPath('data.target_path', '/new-contact');
        $responseUpdate->assertJsonPath('data.status_code', 302);
        $responseUpdate->assertJsonPath('data.is_active', false);
        $this->assertDatabaseHas('seo_redirects', [
            'id' => $redirectId,
            'source_path' => '/older-contact',
            'target_path' => '/new-contact',
            'status_code' => 302,
            'is_active' => 0,
        ]);

        // 5. Delete redirect rule
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/seo/redirects/{$redirectId}");

        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('seo_redirects', ['id' => $redirectId]);
    }

    #[Test]
    public function validation_fails_if_status_code_is_invalid(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/seo/redirects', [
                'source_path' => '/old',
                'target_path' => '/new',
                'status_code' => 404, // only 301 and 302 allowed
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['status_code']);
    }
}
