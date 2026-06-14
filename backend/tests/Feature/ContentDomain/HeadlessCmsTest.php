<?php

namespace Tests\Feature\ContentDomain;

use App\Domains\Content\Models\ContentType;
use App\Domains\Content\Models\ContentEntry;
use App\Domains\Content\Models\ContentRevision;
use App\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class HeadlessCmsTest extends TestCase
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
    public function admin_can_create_content_type_schema(): void
    {
        $payload = [
            'name' => 'Blog Post',
            'slug' => 'blog-post',
            'description' => 'A list of corporate blog articles',
            'is_collection' => true,
            'fields' => [
                [
                    'name' => 'Title',
                    'slug' => 'title',
                    'type' => 'text',
                    'validation_rules' => ['required', 'string', 'max:100'],
                    'options' => ['localized' => true],
                    'order' => 1
                ],
                [
                    'name' => 'Views Count',
                    'slug' => 'views',
                    'type' => 'number',
                    'validation_rules' => ['nullable', 'numeric'],
                    'options' => ['localized' => false],
                    'order' => 2
                ]
            ]
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/content-types', $payload);

        $response->assertStatus(211);
        
        $this->assertDatabaseHas('content_types', [
            'slug' => 'blog-post',
            'is_collection' => true
        ]);

        $this->assertDatabaseHas('content_fields', [
            'slug' => 'title',
            'type' => 'text',
            'order' => 1
        ]);
        
        $this->assertDatabaseHas('content_fields', [
            'slug' => 'views',
            'type' => 'number',
            'order' => 2
        ]);
    }

    #[Test]
    public function dynamic_validation_enforces_rules_for_content_entries(): void
    {
        // 1. Create content type schema
        $contentType = ContentType::create([
            'name' => 'Portfolio',
            'slug' => 'portfolio',
            'is_collection' => true
        ]);

        $contentType->fields()->create([
            'name' => 'Project Name',
            'slug' => 'name',
            'type' => 'text',
            'validation_rules' => ['required'],
            'options' => ['localized' => false]
        ]);

        $contentType->fields()->create([
            'name' => 'Budget',
            'slug' => 'budget',
            'type' => 'number',
            'validation_rules' => ['required'],
            'options' => ['localized' => false]
        ]);

        // 2. Submit invalid payload (missing name, string budget instead of number)
        $invalidPayload = [
            'data' => [
                'budget' => 'one thousand dollars'
            ],
            'status' => 'draft'
        ];

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/content-types/{$contentType->id}/entries", $invalidPayload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['data.name', 'data.budget']);

        // 3. Submit valid payload
        $validPayload = [
            'data' => [
                'name' => 'New SaaS Platform',
                'budget' => 50000
            ],
            'status' => 'draft'
        ];

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/content-types/{$contentType->id}/entries", $validPayload);

        $response->assertStatus(211);
        $this->assertDatabaseHas('content_entries', [
            'content_type_id' => $contentType->id,
            'status' => 'draft'
        ]);
    }

    #[Test]
    public function editing_entries_triggers_automatic_version_tracking(): void
    {
        $contentType = ContentType::create(['name' => 'Page', 'slug' => 'page']);
        $contentType->fields()->create([
            'name' => 'Content',
            'slug' => 'content',
            'type' => 'text',
            'validation_rules' => ['required'],
            'options' => ['localized' => false]
        ]);

        // Create version 1 entry
        $entry = ContentEntry::create([
            'content_type_id' => $contentType->id,
            'data' => ['content' => 'First Draft Content'],
            'status' => 'draft'
        ]);

        ContentRevision::create([
            'content_entry_id' => $entry->id,
            'data' => ['content' => 'First Draft Content'],
            'version' => 1
        ]);

        // Update entry content
        $updatePayload = [
            'data' => ['content' => 'Updated Draft Content'],
            'status' => 'draft'
        ];

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/content-types/{$contentType->id}/entries/{$entry->id}", $updatePayload);

        $response->assertStatus(200);

        // Assert revision version 2 is created
        $this->assertDatabaseHas('content_revisions', [
            'content_entry_id' => $entry->id,
            'version' => 2,
            'data' => json_encode(['content' => 'Updated Draft Content'])
        ]);
    }

    #[Test]
    public function admin_can_rollback_to_historical_revision(): void
    {
        $contentType = ContentType::create(['name' => 'Page', 'slug' => 'page']);
        $contentType->fields()->create([
            'name' => 'Content',
            'slug' => 'content',
            'type' => 'text',
            'options' => ['localized' => false]
        ]);

        $entry = ContentEntry::create([
            'content_type_id' => $contentType->id,
            'data' => ['content' => 'Old Version Content'],
            'status' => 'draft'
        ]);

        $revision = ContentRevision::create([
            'content_entry_id' => $entry->id,
            'data' => ['content' => 'Old Version Content'],
            'version' => 1
        ]);

        // Update to new values
        $entry->update(['data' => ['content' => 'New Incorrect Content']]);

        // Rollback via endpoint
        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/content-types/{$contentType->id}/entries/{$entry->id}/revisions/{$revision->id}/rollback");

        $response->assertStatus(200);
        $this->assertEquals('Old Version Content', $entry->fresh()->data['content']);

        // Assert version 2 revision created indicating rollback
        $this->assertDatabaseHas('content_revisions', [
            'content_entry_id' => $entry->id,
            'version' => 2,
            'data' => json_encode(['content' => 'Old Version Content'])
        ]);
    }

    #[Test]
    public function public_delivery_api_only_returns_published_items_with_filters(): void
    {
        $contentType = ContentType::create(['name' => 'Article', 'slug' => 'article']);
        $contentType->fields()->create([
            'name' => 'Slug',
            'slug' => 'slug',
            'type' => 'text',
            'options' => ['localized' => false]
        ]);
        $contentType->fields()->create([
            'name' => 'Category',
            'slug' => 'category_id',
            'type' => 'number',
            'options' => ['localized' => false]
        ]);

        // 1. Published item
        $entryPublished = ContentEntry::create([
            'content_type_id' => $contentType->id,
            'data' => ['slug' => 'hello-world', 'category_id' => 5],
            'status' => 'published',
            'published_at' => now()
        ]);

        // 2. Draft item
        ContentEntry::create([
            'content_type_id' => $contentType->id,
            'data' => ['slug' => 'draft-article', 'category_id' => 5],
            'status' => 'draft'
        ]);

        // 3. Test list delivery
        $response = $this->getJson('/api/content/delivery/article');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('hello-world', $response->json('data.0.data.slug'));

        // 4. Test list delivery with JSON filter
        $responseFiltered = $this->getJson('/api/content/delivery/article?filters[category_id]=5');
        $responseFiltered->assertStatus(200);
        $this->assertCount(1, $responseFiltered->json('data'));

        // Filter for category 9 should yield empty
        $responseEmpty = $this->getJson('/api/content/delivery/article?filters[category_id]=9');
        $responseEmpty->assertStatus(200);
        $this->assertCount(0, $responseEmpty->json('data'));

        // 5. Test single delivery show by slug
        $responseSingle = $this->getJson('/api/content/delivery/article/hello-world');
        $responseSingle->assertStatus(200)
            ->assertJsonPath('id', $entryPublished->id);
    }
}
