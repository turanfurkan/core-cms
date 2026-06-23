<?php

namespace Tests\Feature\ContentDomain;

use App\Domains\Content\Models\ContentType;
use App\Domains\Content\Models\ContentEntry;
use App\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DynamicZoneTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected ContentType $pageType;
    protected ContentType $blogType;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        // 1. Create a Blog Content Type (for collection relation display testing)
        $this->blogType = ContentType::create([
            'name' => 'Blog Post',
            'slug' => 'blog',
            'is_collection' => true,
            'settings' => [
                'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
            ]
        ]);
        $this->blogType->fields()->create([
            'name' => 'Title',
            'slug' => 'title',
            'type' => 'string',
            'validation_rules' => ['required'],
            'options' => ['localized' => true],
            'order' => 1,
        ]);

        // 2. Create Page Content Type with Dynamic Zone
        $this->pageType = ContentType::create([
            'name' => 'Page',
            'slug' => 'page',
            'is_collection' => false,
            'settings' => [
                'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
            ]
        ]);

        $this->pageType->fields()->create([
            'name' => 'Title',
            'slug' => 'title',
            'type' => 'string',
            'validation_rules' => ['required'],
            'options' => ['localized' => true],
            'order' => 1,
        ]);

        $this->pageType->fields()->create([
            'name' => 'Sections',
            'slug' => 'sections',
            'type' => 'dynamic_zone',
            'validation_rules' => ['nullable'],
            'options' => [
                'allowed_blocks' => [
                    [
                        'type' => 'hero_banner',
                        'name' => 'Hero Banner',
                        'fields' => [
                            ['name' => 'Heading', 'slug' => 'heading', 'type' => 'string', 'validation_rules' => ['required']],
                            ['name' => 'Background', 'slug' => 'background', 'type' => 'string', 'validation_rules' => ['nullable']],
                        ]
                    ],
                    [
                        'type' => 'collection_display',
                        'name' => 'Koleksiyon Listeleme',
                        'fields' => [
                            ['name' => 'Section Title', 'slug' => 'section_title', 'type' => 'string', 'validation_rules' => ['required']],
                            ['name' => 'Target Content Type', 'slug' => 'target_content_type_id', 'type' => 'relation_content_type'],
                            ['name' => 'Limit', 'slug' => 'limit', 'type' => 'number', 'validation_rules' => ['required']],
                        ]
                    ]
                ]
            ],
            'order' => 2,
        ]);
    }

    #[Test]
    public function it_validates_dynamic_zone_subfields_successfully(): void
    {
        // Valid dynamic zone payload
        $payload = [
            'data' => [
                'title' => ['tr' => 'Ana Sayfa', 'en' => 'Homepage'],
                'sections' => [
                    [
                        'id' => 'sec_1',
                        'type' => 'hero_banner',
                        'data' => [
                            'heading' => 'Geleceğe Adım Atın',
                            'background' => '/assets/hero.jpg'
                        ]
                    ]
                ]
            ],
            'status' => 'published'
        ];

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/content-types/{$this->pageType->id}/entries", $payload);

        $response->assertStatus(211);
        $this->assertDatabaseHas('content_entries', [
            'content_type_id' => $this->pageType->id
        ]);
    }

    #[Test]
    public function it_fails_if_dynamic_zone_required_subfield_is_missing(): void
    {
        // Missing required 'heading' inside hero_banner
        $payload = [
            'data' => [
                'title' => ['tr' => 'Ana Sayfa', 'en' => 'Homepage'],
                'sections' => [
                    [
                        'id' => 'sec_1',
                        'type' => 'hero_banner',
                        'data' => [
                            'background' => '/assets/hero.jpg'
                            // heading is missing
                        ]
                    ]
                ]
            ],
            'status' => 'published'
        ];

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/content-types/{$this->pageType->id}/entries", $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('data.sections.0.data.heading');
    }

    #[Test]
    public function it_hydrates_koleksiyon_display_blocks_in_delivery_api(): void
    {
        // 1. Create a published blog entry
        $blogEntry = ContentEntry::create([
            'content_type_id' => $this->blogType->id,
            'status' => 'published',
            'data' => [
                'title' => ['tr' => 'Son Teknoloji Blogu', 'en' => 'Latest Tech Blog'],
                'slug' => ['tr' => 'son-teknoloji', 'en' => 'latest-tech']
            ]
        ]);

        // 2. Create Page with collection_display dynamic block linking to the blog contentType slug
        $pageEntry = ContentEntry::create([
            'content_type_id' => $this->pageType->id,
            'status' => 'published',
            'data' => [
                'title' => ['tr' => 'Bloglar Sayfası', 'en' => 'Blogs Page'],
                'slug' => 'blogs',
                'sections' => [
                    [
                        'id' => 'sec_2',
                        'type' => 'collection_display',
                        'data' => [
                            'section_title' => 'Blog Yazılarımız',
                            'target_content_type_id' => 'blog',
                            'limit' => 3
                        ]
                    ]
                ]
            ]
        ]);

        // 3. Query Public Delivery API
        $response = $this->getJson("/api/content/delivery/page/blogs");

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals('Bloglar Sayfası', $data['title']['tr']);
        $this->assertCount(1, $data['sections']);
        $this->assertEquals('collection_display', $data['sections'][0]['type']);

        // Check that target entries were hydrated
        $this->assertArrayHasKey('hydrated_data', $data['sections'][0]);
        $this->assertCount(1, $data['sections'][0]['hydrated_data']);
        $this->assertEquals('Son Teknoloji Blogu', $data['sections'][0]['hydrated_data'][0]['data']['title']['tr']);
    }
}
