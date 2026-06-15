<?php

namespace App\Domains\Forms\Http\Controllers\Admin;

use App\Domains\Forms\Actions\CreateFormAction;
use App\Domains\Forms\Actions\DeleteFormAction;
use App\Domains\Forms\Actions\UpdateFormAction;
use App\Domains\Forms\DTOs\FormData;
use App\Domains\Forms\Http\Requests\FormRequest;
use App\Domains\Forms\Http\Resources\FormResource;
use App\Domains\Forms\Models\Form;
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
