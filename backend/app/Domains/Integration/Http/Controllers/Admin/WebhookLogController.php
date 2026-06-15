<?php

namespace App\Domains\Integration\Http\Controllers\Admin;

use App\Domains\Integration\Http\Resources\WebhookLogResource;
use App\Domains\Integration\Models\Webhook;
use App\Http\Controllers\Controller;
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
}
