<?php

namespace TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\SEO\Actions\CreateSeoRedirectAction;
use TuranFurkan\CoreCms\Domains\SEO\Actions\DeleteSeoRedirectAction;
use TuranFurkan\CoreCms\Domains\SEO\Actions\UpdateSeoRedirectAction;
use TuranFurkan\CoreCms\Domains\SEO\DTOs\SeoRedirectData;
use TuranFurkan\CoreCms\Domains\SEO\Http\Requests\SeoRedirectRequest;
use TuranFurkan\CoreCms\Domains\SEO\Http\Resources\SeoRedirectResource;
use TuranFurkan\CoreCms\Domains\SEO\Models\SeoRedirect;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SeoRedirectController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $redirects = SeoRedirect::orderBy('id', 'desc')
            ->paginate($request->input('limit', 15));

        return SeoRedirectResource::collection($redirects);
    }

    public function store(SeoRedirectRequest $request, CreateSeoRedirectAction $action): JsonResponse
    {
        $dto = SeoRedirectData::fromRequest($request);
        $redirect = $action->execute($dto);

        return (new SeoRedirectResource($redirect))
            ->response()
            ->setStatusCode(201);
    }

    public function show(SeoRedirect $redirect): SeoRedirectResource
    {
        return new SeoRedirectResource($redirect);
    }

    public function update(SeoRedirect $redirect, SeoRedirectRequest $request, UpdateSeoRedirectAction $action): SeoRedirectResource
    {
        $dto = SeoRedirectData::fromRequest($request);
        $updated = $action->execute($redirect, $dto);

        return new SeoRedirectResource($updated);
    }

    public function destroy(SeoRedirect $redirect, DeleteSeoRedirectAction $action): JsonResponse
    {
        $action->execute($redirect);

        return response()->json([
            'message' => 'SEO redirect configuration deleted successfully.',
        ]);
    }
}
