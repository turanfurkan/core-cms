<?php

namespace TuranFurkan\CoreCms\Domains\Page\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Page\Actions\CreatePageAction;
use TuranFurkan\CoreCms\Domains\Page\Actions\DeletePageAction;
use TuranFurkan\CoreCms\Domains\Page\Actions\UpdatePageAction;
use TuranFurkan\CoreCms\Domains\Page\Http\Requests\PageRequest;
use TuranFurkan\CoreCms\Domains\Page\Http\Resources\PageResource;
use TuranFurkan\CoreCms\Domains\Page\Models\Page;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PageController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Page::query();

        if ($request->has('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('layout') && $request->query('layout') !== 'all') {
            $query->where('layout', $request->query('layout'));
        }

        if ($request->has('parent_id') && $request->query('parent_id') !== 'all') {
            if ($request->query('parent_id') === 'none') {
                $query->whereNull('parent_id');
            } else {
                $query->where('parent_id', $request->query('parent_id'));
            }
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title->tr', 'like', "%{$search}%")
                  ->orWhere('title->en', 'like', "%{$search}%")
                  ->orWhere('slug->tr', 'like', "%{$search}%")
                  ->orWhere('slug->en', 'like', "%{$search}%");
            });
        }

        $pages = $query->with(['coverImage', 'seo', 'parent'])
            ->orderBy('order', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return PageResource::collection($pages);
    }

    public function store(PageRequest $request, CreatePageAction $action): JsonResponse
    {
        $page = $action->execute($request->validated());

        if ($request->has('seo')) {
            $page->updateSeo($request->input('seo'));
        }

        return (new PageResource($page->load(['coverImage', 'seo'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Page $page): PageResource
    {
        return new PageResource($page->load(['coverImage', 'seo', 'parent', 'children']));
    }

    public function update(PageRequest $request, Page $page, UpdatePageAction $action): PageResource
    {
        $updatedPage = $action->execute($page, $request->validated());

        if ($request->has('seo')) {
            $updatedPage->updateSeo($request->input('seo'));
        }

        return new PageResource($updatedPage->load(['coverImage', 'seo', 'parent']));
    }

    public function destroy(Page $page, DeletePageAction $action): JsonResponse
    {
        try {
            $action->execute($page);
            return response()->json(['message' => 'Sayfa başarıyla silindi.']);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
