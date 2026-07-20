<?php

namespace TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Forms\Actions\CreateFormAction;
use TuranFurkan\CoreCms\Domains\Forms\Actions\DeleteFormAction;
use TuranFurkan\CoreCms\Domains\Forms\Actions\UpdateFormAction;
use TuranFurkan\CoreCms\Domains\Forms\DTOs\FormData;
use TuranFurkan\CoreCms\Domains\Forms\Http\Requests\FormRequest;
use TuranFurkan\CoreCms\Domains\Forms\Http\Resources\FormResource;
use TuranFurkan\CoreCms\Domains\Forms\Models\Form;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FormController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $forms = Form::with('fields')
            ->orderBy('id', 'desc')
            ->paginate($request->input('limit', 15));

        return FormResource::collection($forms);
    }

    public function store(FormRequest $request, CreateFormAction $action): JsonResponse
    {
        $dto = FormData::fromRequest($request);
        $form = $action->execute($dto);

        return (new FormResource($form->load('fields')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Form $form): FormResource
    {
        return new FormResource($form->load('fields'));
    }

    public function update(Form $form, FormRequest $request, UpdateFormAction $action): FormResource
    {
        $dto = FormData::fromRequest($request);
        $updated = $action->execute($form, $dto);

        return new FormResource($updated->load('fields'));
    }

    public function destroy(Form $form, DeleteFormAction $action): JsonResponse
    {
        $action->execute($form);

        return response()->json([
            'message' => 'Form deleted successfully.',
        ]);
    }
}
