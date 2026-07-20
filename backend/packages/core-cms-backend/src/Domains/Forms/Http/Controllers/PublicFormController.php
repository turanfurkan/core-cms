<?php

namespace TuranFurkan\CoreCms\Domains\Forms\Http\Controllers;

use TuranFurkan\CoreCms\Domains\Forms\Actions\SubmitFormAction;
use TuranFurkan\CoreCms\Domains\Forms\DTOs\FormSubmissionData;
use TuranFurkan\CoreCms\Domains\Forms\Http\Resources\FormResource;
use TuranFurkan\CoreCms\Domains\Forms\Models\Form;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicFormController extends Controller
{
    public function show(string $slug): FormResource
    {
        $form = Form::where('slug', $slug)
            ->where('is_active', true)
            ->with('fields')
            ->firstOrFail();

        return new FormResource($form);
    }

    public function submit(string $slug, Request $request, SubmitFormAction $action): JsonResponse
    {
        $form = Form::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $dto = FormSubmissionData::fromRequest($request);
        $submission = $action->execute($form, $dto);

        return response()->json([
            'message' => $form->settings['success_message'] ?? 'Mesajınız başarıyla gönderildi.',
            'redirect_url' => $form->settings['redirect_url'] ?? null,
        ]);
    }
}
