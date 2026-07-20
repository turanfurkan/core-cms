<?php

namespace TuranFurkan\CoreCms\Domains\Integration\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Integration\Actions\RetryWebhookLogAction;
use TuranFurkan\CoreCms\Domains\Integration\Http\Resources\WebhookLogResource;
use TuranFurkan\CoreCms\Domains\Integration\Models\Webhook;
use TuranFurkan\CoreCms\Domains\Integration\Models\WebhookLog;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WebhookLogController extends Controller
{
    public function index(Webhook $webhook, Request $request): AnonymousResourceCollection
    {
        $logs = $webhook->logs()
            ->orderBy('id', 'desc')
            ->paginate($request->input('limit', 15));

        return WebhookLogResource::collection($logs);
    }

    public function retry(Webhook $webhook, WebhookLog $log, RetryWebhookLogAction $action): JsonResponse
    {
        $action->execute($webhook, $log);

        return response()->json([
            'message' => 'Webhook delivery re-queued successfully.',
        ]);
    }
}
