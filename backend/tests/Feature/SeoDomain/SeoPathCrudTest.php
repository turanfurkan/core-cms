<?php

namespace Tests\Feature\SeoDomain;

use App\Domains\Identity\Models\User;
use App\Domains\SEO\Models\SeoPath;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SeoPathCrudTest extends TestCase
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
    public function admin_can_manage_seo_paths_crud(): void
    {
        // 1. Create path override
        $responseCreate = $this->actingAs($this->admin)
            ->postJson('/api/admin/seo/paths', [
                'path' => '/about-us',
                'meta_title' => ['tr' => 'Hakkımızda', 'en' => 'About Us'],
                'meta_description' => ['tr' => 'Şirketimiz hakkında bilgi.', 'en' => 'Info about our company.'],
                'meta_keywords' => ['tr' => 'hakkımızda, şirket', 'en' => 'about, company'],
                'canonical_url' => 'https://example.com/about-us',
                'meta_robots' => 'index, follow',
            ]);

        $responseCreate->assertStatus(201);
        $responseCreate->assertJsonPath('data.path', '/about-us');
        $responseCreate->assertJsonPath('data.meta_title.tr', 'Hakkımızda');

        $pathId = $responseCreate->json('data.id');
        $this->assertDatabaseHas('seo_paths', [
            'id' => $pathId,
            'path' => '/about-us',
            'canonical_url' => 'https://example.com/about-us',
        ]);

        // 2. List SEO paths
        $responseList = $this->actingAs($this->admin)
            ->getJson('/api/admin/seo/paths');

        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');

        // 3. Show path
        $responseShow = $this->actingAs($this->admin)
            ->getJson("/api/admin/seo/paths/{$pathId}");

        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.path', '/about-us');

        // 4. Update path
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/seo/paths/{$pathId}", [
                'path' => '/about-us-updated',
                'meta_title' => ['tr' => 'Hakkımızda Güncel'],
                'canonical_url' => 'https://example.com/about-us-new',
            ]);

        $responseUpdate->assertStatus(200);
        $responseUpdate->assertJsonPath('data.path', '/about-us-updated');
        $responseUpdate->assertJsonPath('data.meta_title.tr', 'Hakkımızda Güncel');
        $this->assertDatabaseHas('seo_paths', [
            'id' => $pathId,
            'path' => '/about-us-updated',
            'canonical_url' => 'https://example.com/about-us-new',
        ]);

        // 5. Delete path
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/seo/paths/{$pathId}");

        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('seo_paths', ['id' => $pathId]);
    }

    #[Test]
    public function validation_fails_if_path_has_invalid_format(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/seo/paths', [
                'path' => 'no-leading-slash',
                'meta_title' => ['tr' => 'Invalid path'],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['path']);
    }
}
