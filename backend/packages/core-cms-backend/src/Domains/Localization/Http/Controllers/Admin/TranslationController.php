<?php

namespace TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Localization\Actions\UpsertTranslationAction;
use TuranFurkan\CoreCms\Domains\Localization\DTOs\TranslationData;
use TuranFurkan\CoreCms\Domains\Localization\Http\Requests\TranslationRequest;
use TuranFurkan\CoreCms\Domains\Localization\Http\Resources\TranslationResource;
use TuranFurkan\CoreCms\Domains\Localization\Models\Translation;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TranslationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Translation::query();

        if ($request->filled('group')) {
            $query->where('group', $request->input('group'));
        }

        if ($request->filled('key')) {
            $query->where('key', 'like', '%' . $request->input('key') . '%');
        }

        $translations = $query->latest()->paginate($request->input('limit', 15));
        return TranslationResource::collection($translations);
    }

    public function store(TranslationRequest $request, UpsertTranslationAction $action): JsonResponse
    {
        $dto = TranslationData::fromRequest($request);
        $translation = $action->execute($dto);

        return (new TranslationResource($translation))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Translation $translation): JsonResponse
    {
        $translation->delete();

        return response()->json([
            'message' => 'Translation deleted successfully.',
        ]);
    }
}
