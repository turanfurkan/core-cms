<?php

namespace TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Notification\Actions\CreateNotificationTemplateAction;
use TuranFurkan\CoreCms\Domains\Notification\Actions\UpdateNotificationTemplateAction;
use TuranFurkan\CoreCms\Domains\Notification\DTOs\NotificationTemplateData;
use TuranFurkan\CoreCms\Domains\Notification\Http\Requests\NotificationTemplateRequest;
use TuranFurkan\CoreCms\Domains\Notification\Http\Resources\NotificationTemplateResource;
use TuranFurkan\CoreCms\Domains\Notification\Models\NotificationTemplate;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationTemplateController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $templates = NotificationTemplate::orderBy('id', 'desc')
            ->paginate($request->input('limit', 15));

        return NotificationTemplateResource::collection($templates);
    }

    public function store(NotificationTemplateRequest $request, CreateNotificationTemplateAction $action): JsonResponse
    {
        $dto = NotificationTemplateData::fromRequest($request);
        $template = $action->execute($dto);

        return (new NotificationTemplateResource($template))
            ->response()
            ->setStatusCode(201);
    }

    public function show(NotificationTemplate $template): NotificationTemplateResource
    {
        return new NotificationTemplateResource($template);
    }

    public function update(NotificationTemplate $template, NotificationTemplateRequest $request, UpdateNotificationTemplateAction $action): NotificationTemplateResource
    {
        $dto = NotificationTemplateData::fromRequest($request);
        $updated = $action->execute($template, $dto);

        return new NotificationTemplateResource($updated);
    }

    public function destroy(NotificationTemplate $template): JsonResponse
    {
        $template->delete();

        return response()->json([
            'message' => 'Notification template deleted successfully.',
        ]);
    }
}
