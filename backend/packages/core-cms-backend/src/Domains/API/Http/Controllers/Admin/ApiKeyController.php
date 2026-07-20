<?php

namespace TuranFurkan\CoreCms\Domains\API\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\API\Actions\CreateApiKeyAction;
use TuranFurkan\CoreCms\Domains\API\Actions\DeleteApiKeyAction;
use TuranFurkan\CoreCms\Domains\API\Actions\UpdateApiKeyAction;
use TuranFurkan\CoreCms\Domains\API\DTOs\ApiKeyData;
use TuranFurkan\CoreCms\Domains\API\Http\Requests\ApiKeyRequest;
use TuranFurkan\CoreCms\Domains\API\Http\Resources\ApiKeyResource;
use TuranFurkan\CoreCms\Domains\API\Http\Resources\ApiKeyCreatedResource;
use TuranFurkan\CoreCms\Domains\API\Models\ApiKey;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ApiKeyController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $keys = ApiKey::orderBy('id', 'desc')
            ->paginate($request->input('limit', 15));

        return ApiKeyResource::collection($keys);
    }

    public function store(ApiKeyRequest $request, CreateApiKeyAction $action): JsonResponse
    {
        $dto = ApiKeyData::fromRequest($request);
        $apiKey = $action->execute($dto);

        return (new ApiKeyCreatedResource($apiKey))
            ->response()
            ->setStatusCode(201);
    }

    public function show(ApiKey $apiKey): ApiKeyResource
    {
        return new ApiKeyResource($apiKey);
    }

    public function update(ApiKey $apiKey, ApiKeyRequest $request, UpdateApiKeyAction $action): ApiKeyResource
    {
        $dto = ApiKeyData::fromRequest($request);
        $updated = $action->execute($apiKey, $dto);

        return new ApiKeyResource($updated);
    }

    public function destroy(ApiKey $apiKey, DeleteApiKeyAction $action): JsonResponse
    {
        $action->execute($apiKey);

        return response()->json([
            'message' => 'API key deleted successfully.',
        ]);
    }
}
