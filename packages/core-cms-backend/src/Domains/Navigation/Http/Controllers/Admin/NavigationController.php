<?php

namespace TuranFurkan\CoreCms\Domains\Navigation\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Navigation\Actions\CreateNavigationAction;
use TuranFurkan\CoreCms\Domains\Navigation\Actions\DeleteNavigationAction;
use TuranFurkan\CoreCms\Domains\Navigation\Actions\UpdateNavigationAction;
use TuranFurkan\CoreCms\Domains\Navigation\DTOs\NavigationData;
use TuranFurkan\CoreCms\Domains\Navigation\Http\Requests\NavigationRequest;
use TuranFurkan\CoreCms\Domains\Navigation\Http\Resources\NavigationResource;
use TuranFurkan\CoreCms\Domains\Navigation\Models\Navigation;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NavigationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $navigations = Navigation::orderBy('id', 'desc')
            ->paginate($request->input('limit', 15));

        return NavigationResource::collection($navigations);
    }

    public function store(NavigationRequest $request, CreateNavigationAction $action): JsonResponse
    {
        $dto = NavigationData::fromRequest($request);
        $navigation = $action->execute($dto);

        return (new NavigationResource($navigation->load('rootItems')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Navigation $navigation): NavigationResource
    {
        return new NavigationResource($navigation->load('rootItems'));
    }

    public function update(Navigation $navigation, NavigationRequest $request, UpdateNavigationAction $action): NavigationResource
    {
        $dto = NavigationData::fromRequest($request);
        $updated = $action->execute($navigation, $dto);

        return new NavigationResource($updated->load('rootItems'));
    }

    public function destroy(Navigation $navigation, DeleteNavigationAction $action): JsonResponse
    {
        $action->execute($navigation);

        return response()->json([
            'message' => 'Navigation menu deleted successfully.',
        ]);
    }
}
