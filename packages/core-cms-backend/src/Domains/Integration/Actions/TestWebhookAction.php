<?php

namespace TuranFurkan\CoreCms\Domains\Integration\Actions;

use TuranFurkan\CoreCms\Domains\Integration\Models\Webhook;
use TuranFurkan\CoreCms\Domains\Integration\Models\WebhookLog;
use Illuminate\Support\Facades\Http;

class TestWebhookAction
{
    public function execute(Webhook $webhook): WebhookLog
    {
        $payload = [
            'event' => 'webhook.test',
            'timestamp' => now()->toIso8601String(),
            'message' => 'CoreCMS webhook test handshake',
        ];

        $headers = is_array($webhook->headers) ? $webhook->headers : [];

        if ($webhook->secret) {
            $payloadJson = json_encode($payload);
            $signature = hash_hmac('sha256', $payloadJson, $webhook->secret);
            $headers['X-CoreCMS-Signature'] = $signature;
        }

        $startTime = microtime(true);
        $status = null;
        $body = null;

        try {
            $response = Http::withHeaders($headers)
                ->timeout(10)
                ->post($webhook->url, $payload);

            $status = $response->status();
            $body = substr($response->body(), 0, 2000);
        } catch (\Throwable $e) {
            $status = 0;
            $body = substr($e->getMessage(), 0, 2000);
        } finally {
            $durationMs = (int) ( (microtime(true) - $startTime) * 1000 );

            return WebhookLog::create([
                'webhook_id' => $webhook->id,
                'event' => 'webhook.test',
                'payload' => $payload,
                'response_status' => $status,
                'response_body' => $body,
                'duration_ms' => $durationMs,
            ]);
        }
    }
}
