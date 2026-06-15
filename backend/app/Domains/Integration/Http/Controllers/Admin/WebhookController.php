<?php

namespace App\Domains\Integration\Http\Controllers\Admin;

use App\Domains\Integration\Actions\CreateWebhookAction;
use App\Domains\Integration\Actions\DeleteWebhookAction;
use App\Domains\Integration\Actions\UpdateWebhookAction;
use App\Domains\Integration\DTOs\WebhookData;
use App\Domains\Integration\Http\Requests\WebhookRequest;
use App\Domains\Integration\Http\Resources\WebhookResource;
use App\Domains\Integration\Models\Webhook;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WebhookController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $webhooks = Webhook::orderBy('id', 'desc')
            ->paginate($request->input('limit', 15));

        return WebhookResource::collection($webhooks);
    }

    public function store(WebhookRequest $request, CreateWebhookAction $action): JsonResponse
    {
        $dto = WebhookData::fromRequest($request);
        $webhook = $action->execute($dto);

        return (new WebhookResource($webhook))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Webhook $webhook): WebhookResource
    {
        return new WebhookResource($webhook);
    }

    public function update(Webhook $webhook, WebhookRequest $request, UpdateWebhookAction $action): WebhookResource
    {
        $dto = WebhookData::fromRequest($request);
        $updated = $action->execute($webhook, $dto);

        return new WebhookResource($updated);
    }

    public function destroy(Webhook $webhook, DeleteWebhookAction $action): JsonResponse
    {
        $action->execute($webhook);

        return response()->json([
            'message' => 'Webhook integration deleted successfully.',
        ]);
    }
}
