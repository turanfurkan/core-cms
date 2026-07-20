<?php

namespace TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Localization\Actions\CreateLanguageAction;
use TuranFurkan\CoreCms\Domains\Localization\Actions\DeleteLanguageAction;
use TuranFurkan\CoreCms\Domains\Localization\Actions\UpdateLanguageAction;
use TuranFurkan\CoreCms\Domains\Localization\DTOs\LanguageData;
use TuranFurkan\CoreCms\Domains\Localization\Http\Requests\LanguageRequest;
use TuranFurkan\CoreCms\Domains\Localization\Http\Resources\LanguageResource;
use TuranFurkan\CoreCms\Domains\Localization\Models\Language;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LanguageController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Language::query();
        
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $languages = $query->orderBy('order')->get();
        return LanguageResource::collection($languages);
    }

    public function store(LanguageRequest $request, CreateLanguageAction $action): JsonResponse
    {
        $dto = LanguageData::fromRequest($request);
        $language = $action->execute($dto);

        return (new LanguageResource($language))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Language $language): LanguageResource
    {
        return new LanguageResource($language);
    }

    public function update(Language $language, LanguageRequest $request, UpdateLanguageAction $action): LanguageResource
    {
        $dto = LanguageData::fromRequest($request);
        $updated = $action->execute($language, $dto);

        return new LanguageResource($updated);
    }

    public function destroy(Language $language, DeleteLanguageAction $action): JsonResponse
    {
        $action->execute($language);

        return response()->json([
            'message' => 'Language deleted successfully.',
        ]);
    }
}
