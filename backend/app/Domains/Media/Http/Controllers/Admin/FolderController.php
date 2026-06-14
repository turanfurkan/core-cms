<?php

namespace App\Domains\Media\Http\Controllers\Admin;

use App\Domains\Media\Actions\Folders\CreateFolderAction;
use App\Domains\Media\Actions\Folders\DeleteFolderAction;
use App\Domains\Media\Actions\Folders\MoveFolderAction;
use App\Domains\Media\DTOs\FolderData;
use App\Domains\Media\Http\Requests\FolderRequest;
use App\Domains\Media\Http\Requests\MoveFolderRequest;
use App\Domains\Media\Http\Resources\FolderResource;
use App\Domains\Media\Models\MediaFolder;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FolderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $parentId = $request->input('parent_id');

        $query = MediaFolder::query();

        if ($parentId === 'root') {
            $query->whereNull('parent_id');
        } elseif ($parentId !== null) {
            $query->where('parent_id', $parentId);
        }

        $folders = $query->withCount(['children', 'media'])->get();

        return FolderResource::collection($folders);
    }

    public function store(FolderRequest $request, CreateFolderAction $action): JsonResponse
    {
        $dto = FolderData::fromRequest($request);
        $folder = $action->execute($dto);

        return (new FolderResource($folder))
            ->response()
            ->setStatusCode(201);
    }

    public function show(MediaFolder $folder): FolderResource
    {
        $folder->load(['children', 'media']);
        return new FolderResource($folder);
    }

    public function update(MediaFolder $folder, FolderRequest $request): FolderResource
    {
        $folder->update([
            'name' => $request->input('name'),
        ]);

        return new FolderResource($folder);
    }

    public function move(MediaFolder $folder, MoveFolderRequest $request, MoveFolderAction $action)
    {
        try {
            $action->execute($folder, $request->input('parent_id'));
            return new FolderResource($folder);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(MediaFolder $folder, DeleteFolderAction $action): JsonResponse
    {
        $action->execute($folder);

        return response()->json([
            'message' => 'Folder deleted successfully.',
        ]);
    }
}
