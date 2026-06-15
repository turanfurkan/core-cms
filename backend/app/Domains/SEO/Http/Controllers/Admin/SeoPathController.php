<?php

namespace App\Domains\SEO\Http\Controllers\Admin;

use App\Domains\SEO\Actions\CreateSeoPathAction;
use App\Domains\SEO\Actions\DeleteSeoPathAction;
use App\Domains\SEO\Actions\UpdateSeoPathAction;
use App\Domains\SEO\DTOs\SeoPathData;
use App\Domains\SEO\Http\Requests\SeoPathRequest;
use App\Domains\SEO\Http\Resources\SeoPathResource;
use App\Domains\SEO\Models\SeoPath;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SeoPathController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $paths = SeoPath::orderBy('id', 'desc')
            ->paginate($request->input('limit', 15));

        return SeoPathResource::collection($paths);
    }

    public function store(SeoPathRequest $request, CreateSeoPathAction $action): JsonResponse
    {
        $dto = SeoPathData::fromRequest($request);
        $seoPath = $action->execute($dto);

        return (new SeoPathResource($seoPath))
            ->response()
            ->setStatusCode(201);
    }

    public function show(SeoPath $path): SeoPathResource
    {
        return new SeoPathResource($path);
    }

    public function update(SeoPath $path, SeoPathRequest $request, UpdateSeoPathAction $action): SeoPathResource
    {
        $dto = SeoPathData::fromRequest($request);
        $updated = $action->execute($path, $dto);

        return new SeoPathResource($updated);
    }

    public function destroy(SeoPath $path, DeleteSeoPathAction $action): JsonResponse
    {
        $action->execute($path);

        return response()->json([
            'message' => 'SEO path configuration deleted successfully.',
        ]);
    }
}
