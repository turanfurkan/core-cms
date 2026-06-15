<?php

namespace App\Domains\SEO\Http\Controllers\Public;

use App\Domains\SEO\Http\Resources\SeoMetadataResource;
use App\Domains\SEO\Http\Resources\SeoPathResource;
use App\Domains\SEO\Http\Resources\SeoRedirectResource;
use App\Domains\SEO\Models\SeoPath;
use App\Domains\SEO\Models\SeoRedirect;
use App\Domains\Content\Models\ContentType;
use App\Domains\Content\Models\ContentEntry;
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

        // 2. Check if the path corresponds to a Content Entry: /content-type-slug/entry-slug
        $segments = array_values(array_filter(explode('/', $standardPath)));
        if (count($segments) >= 2) {
            $contentTypeSlug = $segments[0];
            $entrySlug = $segments[1];

            $contentType = ContentType::where('slug', $contentTypeSlug)->first();
            if ($contentType) {
                $entry = ContentEntry::where('content_type_id', $contentType->id)
                    ->where('status', ContentEntry::STATUS_PUBLISHED)
                    ->where(function ($query) use ($entrySlug) {
                        $query->where('data->slug', $entrySlug)
                            ->orWhere('data->slug->tr', $entrySlug)
                            ->orWhere('data->slug->en', $entrySlug);
                    })
                    ->first();

                if ($entry && $entry->seo) {
                    return (new SeoMetadataResource($entry->seo))
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

        // 2. Add all published content entries
        $entries = ContentEntry::where('status', ContentEntry::STATUS_PUBLISHED)
            ->with('contentType')
            ->get();

        foreach ($entries as $entry) {
            if (!$entry->contentType) {
                continue;
            }

            // Fallback default slug or get localized slug
            $slug = $entry->getLocalizedValue('slug') ?: $entry->slug;
            if (!$slug) {
                continue;
            }

            $routes[] = [
                'path' => '/' . $entry->contentType->slug . '/' . $slug,
                'lastmod' => ($entry->published_at ?: $entry->updated_at)->toIso8601String(),
                'changefreq' => 'weekly',
                'priority' => 0.7,
            ];
        }

        return response()->json([
            'routes' => $routes,
        ]);
    }
}
