<?php

namespace Tests\Feature\SeoDomain;

use TuranFurkan\CoreCms\Domains\SEO\Models\SeoPath;
use TuranFurkan\CoreCms\Domains\SEO\Models\SeoRedirect;
use TuranFurkan\CoreCms\Domains\Post\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PublicSeoApiTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function public_visitor_can_resolve_redirects(): void
    {
        SeoRedirect::create([
            'source_path' => '/old-url',
            'target_path' => '/new-url',
            'status_code' => 301,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/seo/redirects/resolve?path=/old-url');

        $response->assertStatus(200);
        $response->assertJsonPath('data.target_path', '/new-url');
        $response->assertJsonPath('data.status_code', 301);
    }

    #[Test]
    public function redirect_resolution_returns_404_if_none_matches_or_inactive(): void
    {
        SeoRedirect::create([
            'source_path' => '/old-url',
            'target_path' => '/new-url',
            'status_code' => 301,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/seo/redirects/resolve?path=/old-url');
        $response->assertStatus(404);
    }

    #[Test]
    public function public_visitor_can_resolve_seo_path_override(): void
    {
        SeoPath::create([
            'path' => '/about-us',
            'meta_title' => ['tr' => 'Hakkımızda'],
            'meta_description' => ['tr' => 'Hakkımızda Açıklama'],
        ]);

        $response = $this->getJson('/api/seo/metadata/resolve?path=/about-us');

        $response->assertStatus(200);
        $response->assertJsonPath('data.path', '/about-us');
        $response->assertJsonPath('data.meta_title.tr', 'Hakkımızda');
    }

    #[Test]
    public function public_visitor_can_resolve_seo_via_post(): void
    {
        $post = Post::create([
            'title' => ['tr' => 'Hello World', 'en' => 'Hello World'],
            'slug' => ['tr' => 'hello-world', 'en' => 'hello-world'],
            'content' => ['tr' => 'Lorem ipsum', 'en' => 'Lorem ipsum'],
            'summary' => ['tr' => 'Summary', 'en' => 'Summary'],
            'status' => 'published',
        ]);

        $post->seo()->create([
            'meta_title' => ['tr' => 'Blog Yazısı'],
            'meta_description' => ['tr' => 'Blog Detayları'],
        ]);

        $response = $this->getJson('/api/seo/metadata/resolve?path=/blog/hello-world');

        $response->assertStatus(200);
        $response->assertJsonPath('data.meta_title.tr', 'Blog Yazısı');
        $response->assertJsonPath('data.meta_description.tr', 'Blog Detayları');
    }

    #[Test]
    public function resolve_path_seo_returns_404_if_not_found(): void
    {
        $response = $this->getJson('/api/seo/metadata/resolve?path=/not-found-page');
        $response->assertStatus(404);
    }

    #[Test]
    public function sitemap_endpoint_returns_configured_routes(): void
    {
        // 1. Add a path override
        SeoPath::create([
            'path' => '/contact',
            'meta_title' => ['tr' => 'İletişim'],
        ]);

        // 2. Add a published post
        Post::create([
            'title' => ['tr' => 'Hello World', 'en' => 'Hello World'],
            'slug' => ['tr' => 'cool-gadget', 'en' => 'cool-gadget'],
            'content' => ['tr' => 'Lorem ipsum', 'en' => 'Lorem ipsum'],
            'summary' => ['tr' => 'Summary', 'en' => 'Summary'],
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/seo/sitemap');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'routes');
        $response->assertJsonPath('routes.0.path', '/contact');
        $response->assertJsonPath('routes.1.path', '/blog/cool-gadget');
    }
}
