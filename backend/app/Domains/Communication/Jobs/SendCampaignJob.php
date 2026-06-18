<?php

namespace App\Domains\Communication\Jobs;

use App\Domains\Communication\Models\Campaign;
use App\Domains\Communication\Models\Subscriber;
use App\Domains\Notification\Support\DynamicNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class SendCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Campaign $campaign
    ) {}

    public function handle(): void
    {
        $campaign = $this->campaign;

        if ($campaign->status === 'sent') {
            return;
        }

        $campaign->update([
            'status' => 'sending',
        ]);

        $subscribers = Subscriber::where('status', 'active')->get();
        $total = $subscribers->count();
        $success = 0;
        $failed = 0;

        foreach ($subscribers as $subscriber) {
            try {
                // Generate a signed unsubscribe link valid for 30 days
                $unsubscribeUrl = URL::signedRoute(
                    'subscribers.unsubscribe',
                    ['subscriber' => $subscriber->id],
                    now()->addDays(30)
                );

                $variables = [
                    'email' => $subscriber->email,
                    'unsubscribe_url' => $unsubscribeUrl,
                ];

                $subscriber->notify(new DynamicNotification($campaign->template_code, $variables));
                $success++;
            } catch (\Throwable $e) {
                Log::error("Failed to send campaign {$campaign->id} to subscriber {$subscriber->email}: " . $e->getMessage());
                $failed++;
            }
        }

        $campaign->update([
            'status' => $failed === $total && $total > 0 ? 'failed' : 'sent',
            'sent_at' => now(),
            'summary' => [
                'total' => $total,
                'success' => $success,
                'failed' => $failed,
            ],
        ]);
    }
}
