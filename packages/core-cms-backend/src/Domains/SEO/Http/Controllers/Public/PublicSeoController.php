<?php

namespace TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Public;

use TuranFurkan\CoreCms\Domains\SEO\Http\Resources\SeoMetadataResource;
use TuranFurkan\CoreCms\Domains\SEO\Http\Resources\SeoPathResource;
use TuranFurkan\CoreCms\Domains\SEO\Http\Resources\SeoRedirectResource;
use TuranFurkan\CoreCms\Domains\SEO\Models\SeoPath;
use TuranFurkan\CoreCms\Domains\SEO\Models\SeoRedirect;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicSeoController extends Controller
{
    public function resolveRedirect(Request $request): JsonResponse
    {
        $path = $request->query('path');
        
        if (empty($path)) {
            return response()->json(['error' => 'Path parameter is required.'], 400);
        }

        $standardPath = '/' . ltrim(rtrim($path, '/'), '/');

        $redirect = SeoRedirect::where('source_path', $standardPath)
            ->where('is_active', true)
            ->first();

        if (!$redirect) {
            return response()->json(['message' => 'No redirect rule found for this path.'], 404);
        }

        return (new SeoRedirectResource($redirect))
            ->response()
            ->setStatusCode(200);
    }

    public function resolvePathSeo(Request $request): JsonResponse
    {
        $path = $request->query('path');

        if (empty($path)) {
            return response()->json(['error' => 'Path parameter is required.'], 400);
        }

        $standardPath = '/' . ltrim(rtrim($path, '/'), '/');

        // 1. Check custom path-based SEO overrides first
        $pathSeo = SeoPath::where('path', $standardPath)->first();
        if ($pathSeo) {
            return (new SeoPathResource($pathSeo))
                ->response()
                ->setStatusCode(200);
        }

        // 2. Check if the path corresponds to a Post: /blog/entry-slug
        $segments = array_values(array_filter(explode('/', $standardPath)));
        if (count($segments) >= 2) {
            $contentTypeSlug = $segments[0];
            $entrySlug = $segments[1];

            if ($contentTypeSlug === 'blog' || $contentTypeSlug === 'posts') {
                $post = \TuranFurkan\CoreCms\Domains\Post\Models\Post::where('status', 'published')
                    ->where(function ($query) use ($entrySlug) {
                        $query->where('slug->tr', $entrySlug)
                            ->orWhere('slug->en', $entrySlug);
                    })
                    ->first();

                if ($post && $post->seo) {
                    return (new SeoMetadataResource($post->seo))
                        ->response()
                        ->setStatusCode(200);
                }
            }

            if ($contentTypeSlug === 'pages') {
                $page = \TuranFurkan\CoreCms\Domains\Page\Models\Page::where('status', 'published')
                    ->where(function ($query) use ($entrySlug) {
                        $query->where('slug->tr', $entrySlug)
                            ->orWhere('slug->en', $entrySlug);
                    })
                    ->first();

                if ($page && $page->seo) {
                    return (new SeoMetadataResource($page->seo))
                        ->response()
                        ->setStatusCode(200);
                }
            }
        }

        return response()->json(['message' => 'No SEO metadata found for this path.'], 404);
    }

    public function sitemap(): JsonResponse
    {
        $routes = [];

        // 1. Add all custom SEO paths configured
        $paths = SeoPath::orderBy('path', 'asc')->get();
        foreach ($paths as $path) {
            $routes[] = [
                'path' => $path->path,
                'lastmod' => $path->updated_at->toIso8601String(),
                'changefreq' => 'weekly',
                'priority' => 0.8,
            ];
        }

        // 2. Add all published posts
        $posts = \TuranFurkan\CoreCms\Domains\Post\Models\Post::where('status', 'published')->get();
        foreach ($posts as $post) {
            $slug = is_array($post->slug) ? ($post->slug['tr'] ?? $post->slug['en'] ?? '') : $post->slug;
            if ($slug) {
                $routes[] = [
                    'path' => '/blog/' . $slug,
                    'lastmod' => ($post->publish_date ?: $post->updated_at)->toIso8601String(),
                    'changefreq' => 'weekly',
                    'priority' => 0.7,
                ];
            }
        }

        // 3. Add all published pages
        $pages = \TuranFurkan\CoreCms\Domains\Page\Models\Page::where('status', 'published')->get();
        foreach ($pages as $page) {
            $slug = is_array($page->slug) ? ($page->slug['tr'] ?? $page->slug['en'] ?? '') : $page->slug;
            if ($slug) {
                $routes[] = [
                    'path' => '/' . $slug,
                    'lastmod' => $page->updated_at->toIso8601String(),
                    'changefreq' => 'weekly',
                    'priority' => 0.7,
                ];
            }
        }

        // 4. Add all published races
        $races = \TuranFurkan\CoreCms\Domains\Race\Models\Race::where('status', 'published')->get();
        foreach ($races as $race) {
            $slug = is_array($race->slug) ? ($race->slug['tr'] ?? $race->slug['en'] ?? '') : $race->slug;
            if ($slug) {
                $routes[] = [
                    'path' => '/races/' . $slug,
                    'lastmod' => $race->updated_at->toIso8601String(),
                    'changefreq' => 'weekly',
                    'priority' => 0.7,
                ];
            }
        }

        return response()->json([
            'routes' => $routes,
        ]);
    }
}

