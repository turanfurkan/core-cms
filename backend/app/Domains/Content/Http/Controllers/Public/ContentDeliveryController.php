<?php

namespace App\Domains\Content\Http\Controllers\Public;

use App\Domains\Content\Http\Resources\ContentEntryResource;
use App\Domains\Content\Models\ContentType;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ContentDeliveryController extends Controller
{
    /**
     * List all published entries for a content type.
     */
    public function index(string $contentTypeSlug, Request $request): JsonResponse
    {
        $contentType = ContentType::where('slug', $contentTypeSlug)->firstOrFail();

        $filters = $request->input('filters', []);
        $perPage = (int) $request->input('limit', 15);
        $page = (int) $request->input('page', 1);

        $cacheParams = [
            'page' => $page,
            'limit' => $perPage,
            'filters' => $filters,
        ];

        $responseData = \App\Domains\Content\Support\ContentCacheHelper::remember(
            $contentType->slug,
            'list',
            $cacheParams,
            function () use ($contentType, $filters, $perPage) {
                $query = $contentType->entries()
                    ->where('status', 'published')
                    ->where(function ($q) {
                        $q->whereNull('published_at')
                          ->orWhere('published_at', '<=', now());
                    });

                // Apply filters
                foreach ($filters as $key => $value) {
                    if ($value !== null && $value !== '') {
                        if (is_numeric($value)) {
                            $value = (int) $value == $value ? (int) $value : (float) $value;
                        }

                        if (is_array($value)) {
                            $query->whereJsonContains("data->{$key}", $value);
                        } else {
                            $query->where("data->{$key}", $value);
                        }
                    }
                }

                // Eager load SEO relation for all entries
                $query->with('seo');

                $entries = $query->paginate($perPage);
                return ContentEntryResource::collection($entries)->toResponse(request())->getData(true);
            }
        );

        return response()->json($responseData);
    }

    /**
     * Get a single published entry by its slug inside the data JSON.
     */
    public function show(string $contentTypeSlug, string $entrySlug): JsonResponse
    {
        $contentType = ContentType::where('slug', $contentTypeSlug)->firstOrFail();

        $cacheParams = [
            'slug' => $entrySlug,
        ];

        $responseData = \App\Domains\Content\Support\ContentCacheHelper::remember(
            $contentType->slug,
            'show',
            $cacheParams,
            function () use ($contentType, $entrySlug) {
                $entry = $contentType->entries()
                    ->where('status', 'published')
                    ->where(function ($q) {
                        $q->whereNull('published_at')
                          ->orWhere('published_at', '<=', now());
                    })
                    ->where(function ($query) use ($entrySlug) {
                        $query->where('data->slug', $entrySlug)
                            ->orWhere('data->slug->tr', $entrySlug)
                            ->orWhere('data->slug->en', $entrySlug);
                    })
                    ->firstOrFail();

                $entry->load('seo');

                return (new ContentEntryResource($entry))->toResponse(request())->getData(true);
            }
        );

        return response()->json($responseData);
    }
}
