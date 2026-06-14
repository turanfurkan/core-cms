<?php

namespace App\Domains\Media\Http\Controllers\Admin;

use App\Domains\Media\Actions\Files\DeleteMediaAction;
use App\Domains\Media\Actions\Files\MoveMediaAction;
use App\Domains\Media\Actions\Files\UpdateMediaMetaAction;
use App\Domains\Media\Actions\Files\UploadMediaAction;
use App\Domains\Media\DTOs\MediaMetaData;
use App\Domains\Media\DTOs\UploadMediaData;
use App\Domains\Media\Http\Requests\MoveMediaRequest;
use App\Domains\Media\Http\Requests\UpdateMediaMetaRequest;
use App\Domains\Media\Http\Requests\UploadMediaRequest;
use App\Domains\Media\Http\Resources\MediaResource;
use App\Domains\Media\Models\MediaItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MediaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $folderId = $request->input('folder_id');

        $query = MediaItem::query();

        if ($folderId === 'root') {
            $query->whereNull('folder_id');
        } elseif ($folderId !== null) {
            $query->where('folder_id', $folderId);
        }

        $media = $query->latest()->paginate($request->input('limit', 15));

        return MediaResource::collection($media);
    }

    public function store(UploadMediaRequest $request, UploadMediaAction $action): JsonResponse
    {
        $dto = UploadMediaData::fromRequest($request);
        $media = $action->execute($dto);

        return (new MediaResource($media))
            ->response()
            ->setStatusCode(201);
    }

    public function show(MediaItem $media): MediaResource
    {
        return new MediaResource($media);
    }

    public function updateMeta(MediaItem $media, UpdateMediaMetaRequest $request, UpdateMediaMetaAction $action): MediaResource
    {
        $dto = MediaMetaData::fromRequest($request);
        $updated = $action->execute($media, $dto);

        return new MediaResource($updated);
    }

    public function move(MediaItem $media, MoveMediaRequest $request, MoveMediaAction $action): MediaResource
    {
        $updated = $action->execute($media, $request->input('folder_id'));

        return new MediaResource($updated);
    }

    public function destroy(MediaItem $media, DeleteMediaAction $action): JsonResponse
    {
        $action->execute($media);

        return response()->json([
            'message' => 'Media deleted successfully.',
        ]);
    }
}
