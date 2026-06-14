<?php

namespace Tests\Feature\ContentDomain;

use App\Domains\Content\Models\ContentType;
use App\Domains\Content\Models\ContentEntry;
use App\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CmsAdditionsTest extends TestCase
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
    public function it_can_auto_generate_slugs_including_localized_values(): void
    {
        $contentType = ContentType::create(['name' => 'News', 'slug' => 'news']);
        $contentType->fields()->create([
            'name' => 'Title',
            'slug' => 'title',
            'type' => 'text',
            'options' => ['localized' => true]
        ]);
        $contentType->fields()->create([
            'name' => 'Slug',
            'slug' => 'slug',
            'type' => 'slug',
            'options' => ['source' => 'title', 'localized' => true]
        ]);

        // 1. Localized title payload with empty slug
        $payload = [
            'data' => [
                'title' => [
                    'tr' => 'Yeni Türkçe Başlık 2026!',
                    'en' => 'New English Title 2026!'
                ],
                'slug' => [
                    'tr' => '',
                    'en' => ''
                ]
            ],
            'status' => 'draft'
        ];

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/content-types/{$contentType->id}/entries", $payload);

        $response->assertStatus(211);
        $entry = ContentEntry::first();

        // Assert localized slugs were correctly generated
        $this->assertEquals('yeni-turkce-baslik-2026', $entry->data['slug']['tr']);
        $this->assertEquals('new-english-title-2026', $entry->data['slug']['en']);

        // 2. Collision Test: Insert same title again, slug should get -1 suffix
        $responseCollision = $this->actingAs($this->admin)
            ->postJson("/api/admin/content-types/{$contentType->id}/entries", $payload);

        $responseCollision->assertStatus(211);
        $entry2 = ContentEntry::orderBy('id', 'desc')->first();
        $this->assertEquals('yeni-turkce-baslik-2026-1', $entry2->data['slug']['tr']);
        $this->assertEquals('new-english-title-2026-1', $entry2->data['slug']['en']);
    }

    #[Test]
    public function it_enforces_scheduled_publishing_dates_correctly(): void
    {
        $contentType = ContentType::create(['name' => 'Event', 'slug' => 'event']);
        $contentType->fields()->create([
            'name' => 'Title',
            'slug' => 'title',
            'type' => 'text'
        ]);

        // Future scheduled event
        ContentEntry::create([
            'content_type_id' => $contentType->id,
            'data' => ['title' => 'Future Event'],
            'status' => 'published',
            'published_at' => now()->addDays(5)
        ]);

        // Past event (should show up)
        ContentEntry::create([
            'content_type_id' => $contentType->id,
            'data' => ['title' => 'Past Event'],
            'status' => 'published',
            'published_at' => now()->subDays(1)
        ]);

        // Query delivery API
        $response = $this->getJson('/api/content/delivery/event');
        $response->assertStatus(200);

        // Should return exactly 1 item (the past event)
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Past Event', $response->json('data.0.data.title'));
    }

    #[Test]
    public function api_delivery_responses_are_cached_and_invalidated_upon_changes(): void
    {
        $contentType = ContentType::create(['name' => 'Page', 'slug' => 'page']);
        $contentType->fields()->create([
            'name' => 'Title',
            'slug' => 'title',
            'type' => 'text'
        ]);

        $entry = ContentEntry::create([
            'content_type_id' => $contentType->id,
            'data' => ['title' => 'Initial Page Title'],
            'status' => 'published',
            'published_at' => now()->subHour()
        ]);

        // First call caches the page
        $response1 = $this->getJson('/api/content/delivery/page');
        $response1->assertStatus(200);
        $this->assertEquals('Initial Page Title', $response1->json('data.0.data.title'));

        // Manually alter the database values without cache busting to prove cache exists
        DB::table('content_entries')->where('id', $entry->id)->update([
            'data' => json_encode(['title' => 'Direct DB Title Change'])
        ]);

        // Second call should still load old cached title
        $response2 = $this->getJson('/api/content/delivery/page');
        $this->assertEquals('Initial Page Title', $response2->json('data.0.data.title'));

        // Perform edit through the API action (which invalidates version cache)
        $this->actingAs($this->admin)
            ->putJson("/api/admin/content-types/{$contentType->id}/entries/{$entry->id}", [
                'data' => ['title' => 'Officially Updated Title'],
                'status' => 'published'
            ]);

        // Next call should load the fresh officially updated title
        $response3 = $this->getJson('/api/content/delivery/page');
        $response3->assertStatus(200);
        $this->assertEquals('Officially Updated Title', $response3->json('data.0.data.title'));
    }

    #[Test]
    public function it_resolves_media_ids_to_full_spatie_url_objects(): void
    {
        $contentType = ContentType::create(['name' => 'Item', 'slug' => 'item']);
        $contentType->fields()->create([
            'name' => 'Gallery Image',
            'slug' => 'image',
            'type' => 'media'
        ]);

        // Insert mock row in media table
        $mediaId = DB::table('media')->insertGetId([
            'model_type' => ContentEntry::class,
            'model_id' => 999,
            'collection_name' => 'images',
            'name' => 'test_photo',
            'file_name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'disk' => 'public',
            'size' => 12450,
            'manipulations' => '[]',
            'custom_properties' => '[]',
            'generated_conversions' => '[]',
            'responsive_images' => '[]',
        ]);

        $entry = ContentEntry::create([
            'content_type_id' => $contentType->id,
            'data' => ['image' => $mediaId],
            'status' => 'published',
            'published_at' => now()->subHour()
        ]);

        $response = $this->getJson('/api/content/delivery/item');
        $response->assertStatus(200);

        // Assert image is resolved to media metadata block
        $resolvedField = $response->json('data.0.data.image');
        $this->assertIsArray($resolvedField);
        $this->assertEquals('test_photo', $resolvedField['name']);
        $this->assertEquals('photo.jpg', $resolvedField['file_name']);
        $this->assertStringContainsString("/storage/{$mediaId}/photo.jpg", $resolvedField['url']);
    }

    #[Test]
    public function it_saves_polymorphic_seo_metadata_and_returns_in_api(): void
    {
        $contentType = ContentType::create(['name' => 'Post', 'slug' => 'post']);
        $contentType->fields()->create([
            'name' => 'Title',
            'slug' => 'title',
            'type' => 'text'
        ]);

        $payload = [
            'data' => [
                'title' => 'Blog Post'
            ],
            'seo' => [
                'meta_title' => ['tr' => 'Seo Başlığı', 'en' => 'SEO Title'],
                'meta_description' => ['tr' => 'Açıklama', 'en' => 'Description'],
                'canonical_url' => 'https://example.com/canonical-url',
                'meta_robots' => 'index, follow'
            ],
            'status' => 'published'
        ];

        // 1. Create entry with SEO
        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/content-types/{$contentType->id}/entries", $payload);

        $response->assertStatus(211);
        $entryId = $response->json('id');

        $this->assertDatabaseHas('seo_metadata', [
            'seoable_type' => ContentEntry::class,
            'seoable_id' => $entryId,
            'canonical_url' => 'https://example.com/canonical-url',
            'meta_robots' => 'index, follow'
        ]);

        // 2. Fetch via public Delivery API, verify SEO block returned
        $responseDelivery = $this->getJson('/api/content/delivery/post');
        $responseDelivery->assertStatus(200);

        $seoBlock = $responseDelivery->json('data.0.seo');
        $this->assertNotNull($seoBlock);
        $this->assertEquals('Seo Başlığı', $seoBlock['meta_title']['tr']);
        $this->assertEquals('SEO Title', $seoBlock['meta_title']['en']);
        $this->assertEquals('index, follow', $seoBlock['meta_robots']);
    }
}
