<?php

namespace App\Domains\Content\Http\Controllers\Admin;

use App\Domains\Content\Actions\Schemas\CreateContentTypeAction;
use App\Domains\Content\Actions\Schemas\DeleteContentTypeAction;
use App\Domains\Content\Actions\Schemas\SaveContentFieldsAction;
use App\Domains\Content\Actions\Schemas\UpdateContentTypeAction;
use App\Domains\Content\DTOs\ContentFieldData;
use App\Domains\Content\DTOs\ContentTypeData;
use App\Domains\Content\Http\Requests\ContentTypeRequest;
use App\Domains\Content\Http\Resources\ContentTypeResource;
use App\Domains\Content\Models\ContentType;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ContentTypeController extends Controller
{
    public function __construct()
    {
        // Add middleware authorization logic here if needed
    }

    public function index(): AnonymousResourceCollection
    {
        $types = ContentType::with('fields')->get();
        return ContentTypeResource::collection($types);
    }

    public function store(
        ContentTypeRequest $request,
        CreateContentTypeAction $createAction,
        SaveContentFieldsAction $saveFieldsAction
    ): JsonResponse {
        $typeDto = ContentTypeData::fromArray($request->validated());
        $contentType = $createAction->execute($typeDto);

        if ($request->has('fields')) {
            $fieldsDtoList = [];
            foreach ($request->input('fields') as $field) {
                $fieldsDtoList[] = ContentFieldData::fromArray($field);
            }
            $saveFieldsAction->execute($contentType, $fieldsDtoList);
        }

        return (new ContentTypeResource($contentType->load('fields')))
            ->response()
            ->setStatusCode(211);
    }

    public function show(ContentType $contentType): ContentTypeResource
    {
        return new ContentTypeResource($contentType->load('fields'));
    }

    public function update(
        ContentType $contentType,
        ContentTypeRequest $request,
        UpdateContentTypeAction $updateAction,
        SaveContentFieldsAction $saveFieldsAction
    ): ContentTypeResource {
        $typeDto = ContentTypeData::fromArray($request->validated());
        $updatedType = $updateAction->execute($contentType, $typeDto);

        if ($request->has('fields')) {
            $fieldsDtoList = [];
            foreach ($request->input('fields') as $field) {
                $fieldsDtoList[] = ContentFieldData::fromArray($field);
            }
            $saveFieldsAction->execute($updatedType, $fieldsDtoList);
        }

        return new ContentTypeResource($updatedType->load('fields'));
    }

    public function destroy(ContentType $contentType, DeleteContentTypeAction $deleteAction): JsonResponse
    {
        $deleteAction->execute($contentType);
        return response()->json(['message' => 'Content type deleted successfully.']);
    }
}
