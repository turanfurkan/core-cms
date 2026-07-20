<?php

namespace TuranFurkan\CoreCms\Domains\Category\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Category\Http\Requests\CategoryRequest;
use TuranFurkan\CoreCms\Domains\Category\Http\Resources\CategoryResource;
use TuranFurkan\CoreCms\Domains\Category\Models\Category;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Category::query();

        if ($request->has('type') && $request->query('type') !== 'all') {
            $query->where('type', $request->query('type'));
        }

        if ($request->has('slug')) {
            $slug = $request->query('slug');
            $query->where(function ($q) use ($slug) {
                $q->where('slug->tr', $slug)
                  ->orWhere('slug->en', $slug);
            });
        }

        if ($request->boolean('tree')) {
            $query->whereNull('parent_id')
                ->with(['children' => function ($q) {
                    $q->orderBy('order', 'asc')->orderBy('id', 'asc');
                }]);
        }

        $categories = $query->withCount('races')
            ->with([
                'coverImage',
                'races.coverImage',
                'races.graphicImage',
                'races.gpxFile',
                'races.stravaFile',
                'races' => function ($q) {
                    $q->where('status', 'published')
                      ->orderBy('start_date', 'asc')
                      ->with('childRaces'); // multi-race conflict detection için
                }
            ])
            ->orderBy('order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load('parent'));
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $category->update($request->validated());

        return new CategoryResource($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();
        return response()->json(['message' => 'Category deleted successfully.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|integer|exists:categories,id',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->input('order') as $index => $id) {
                Category::where('id', $id)->update(['order' => $index + 1]);
            }
        });

        return response()->json(['message' => 'Categories reordered successfully.']);
    }
}
