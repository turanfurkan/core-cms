<?php

namespace TuranFurkan\CoreCms\Domains\Integration\Jobs;

use TuranFurkan\CoreCms\Domains\Integration\Models\Webhook;
use TuranFurkan\CoreCms\Domains\Integration\Models\WebhookLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class DispatchWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Webhook $webhook,
        public readonly string $event,
        public readonly array $payload
    ) {}

    public function handle(): void
    {
        // Don't send if webhook is inactive
        if (!$this->webhook->is_active) {
            return;
        }

        $headers = is_array($this->webhook->headers) ? $this->webhook->headers : [];
        
        // Setup payload signature if secret exists
        if ($this->webhook->secret) {
            $payloadJson = json_encode($this->payload);
            $signature = hash_hmac('sha256', $payloadJson, $this->webhook->secret);
            $headers['X-CoreCMS-Signature'] = $signature;
        }

        $startTime = microtime(true);
        $status = null;
        $body = null;

        try {
            $response = Http::withHeaders($headers)
                ->timeout(10)
                ->post($this->webhook->url, $this->payload);

            $status = $response->status();
            $body = substr($response->body(), 0, 2000); // truncate response body to prevent DB overflow
        } catch (\Throwable $e) {
            $status = 0;
            $body = substr($e->getMessage(), 0, 2000);
        } finally {
            $durationMs = (int) ( (microtime(true) - $startTime) * 1000 );

            WebhookLog::create([
                'webhook_id' => $this->webhook->id,
                'event' => $this->event,
                'payload' => $this->payload,
                'response_status' => $status,
                'response_body' => $body,
                'duration_ms' => $durationMs,
            ]);
        }
    }
}
