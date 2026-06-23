<?php

namespace App\Domains\Content\Http\Controllers\Admin;

use App\Domains\Content\Actions\Entries\CreateContentEntryAction;
use App\Domains\Content\Actions\Entries\DeleteContentEntryAction;
use App\Domains\Content\Actions\Entries\ListContentEntriesAction;
use App\Domains\Content\Actions\Entries\PublishContentEntryAction;
use App\Domains\Content\Actions\Entries\UpdateContentEntryAction;
use App\Domains\Content\Actions\Revisions\RollbackToRevisionAction;
use App\Domains\Content\DTOs\ContentEntryData;
use App\Domains\Content\Http\Requests\ContentEntryRequest;
use App\Domains\Content\Http\Resources\ContentEntryResource;
use App\Domains\Content\Models\ContentEntry;
use App\Domains\Content\Models\ContentType;
use App\Domains\Content\Models\ContentRevision;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ContentEntryController extends Controller
{
    public function index(
        ContentType $contentType,
        Request $request,
        ListContentEntriesAction $listAction
    ): AnonymousResourceCollection {
        $filters = $request->input('filters', []);
        $status = $request->input('status');
        $perPage = (int) $request->input('limit', 15);

        $entries = $listAction->execute($contentType, $filters, $status, $perPage);
        return ContentEntryResource::collection($entries);
    }

    public function store(
        ContentType $contentType,
        ContentEntryRequest $request,
        CreateContentEntryAction $createAction
    ): JsonResponse {
        $dto = ContentEntryData::fromArray($request->validated());
        $userId = auth()->id();

        $entry = $createAction->execute($contentType, $dto, $userId);

        return (new ContentEntryResource($entry))
            ->response()
            ->setStatusCode(211);
    }

    public function show(ContentType $contentType, ContentEntry $contentEntry): ContentEntryResource
    {
        return new ContentEntryResource($contentEntry);
    }

    public function update(
        ContentType $contentType,
        ContentEntry $contentEntry,
        ContentEntryRequest $request,
        UpdateContentEntryAction $updateAction
    ): ContentEntryResource {
        $dto = ContentEntryData::fromArray($request->validated());
        $userId = auth()->id();

        $updatedEntry = $updateAction->execute($contentEntry, $dto, $userId);

        return new ContentEntryResource($updatedEntry);
    }

    public function destroy(
        ContentType $contentType,
        ContentEntry $contentEntry,
        DeleteContentEntryAction $deleteAction
    ): JsonResponse {
        $deleteAction->execute($contentEntry);
        return response()->json(['message' => 'Content entry deleted successfully.']);
    }

    public function publish(
        ContentType $contentType,
        ContentEntry $contentEntry,
        Request $request,
        PublishContentEntryAction $publishAction
    ): ContentEntryResource {
        $status = $request->input('status', ContentEntry::STATUS_PUBLISHED);
        $updated = $publishAction->execute($contentEntry, $status);

        return new ContentEntryResource($updated);
    }

    public function revisions(ContentType $contentType, ContentEntry $contentEntry): JsonResponse
    {
        $revisions = $contentEntry->revisions()->with('creator')->get();
        return response()->json([
            'data' => $revisions->map(fn($rev) => [
                'id' => $rev->id,
                'version' => $rev->version,
                'created_at' => $rev->created_at->toIso8601String(),
                'creator' => $rev->creator ? [
                    'id' => $rev->creator->id,
                    'name' => $rev->creator->name,
                ] : null,
                'data' => $rev->data,
            ])
        ]);
    }

    public function rollback(
        ContentType $contentType,
        ContentEntry $contentEntry,
        ContentRevision $contentRevision,
        RollbackToRevisionAction $rollbackAction
    ): ContentEntryResource {
        $userId = auth()->id();
        $updated = $rollbackAction->execute($contentEntry, $contentRevision, $userId);

        return new ContentEntryResource($updated);
    }
}
