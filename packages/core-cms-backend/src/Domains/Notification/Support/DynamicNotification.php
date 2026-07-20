<?php

namespace TuranFurkan\CoreCms\Domains\Notification\Support;

use TuranFurkan\CoreCms\Domains\Notification\Models\NotificationTemplate;
use TuranFurkan\CoreCms\Domains\Notification\Support\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DynamicNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $templateCode,
        public readonly array $variables = []
    ) {}

    public function via($notifiable): array
    {
        $template = NotificationTemplate::where('code', $this->templateCode)
            ->where('is_active', true)
            ->first();

        if (!$template) {
            return [];
        }

        $channels = [];
        foreach ($template->channels as $channel) {
            if ($channel === 'sms') {
                $channels[] = SmsChannel::class;
            } else {
                $channels[] = $channel;
            }
        }

        return $channels;
    }

    public function toMail($notifiable): ?MailMessage
    {
        $template = NotificationTemplate::where('code', $this->templateCode)->first();
        if (!$template || !in_array('mail', $template->channels)) {
            return null;
        }

        $subject = $this->renderString($template->subject ?? 'CoreCMS Bildirim', $this->variables);
        $body = $this->renderString($template->content['mail'] ?? '', $this->variables);

        return (new MailMessage)
            ->subject($subject)
            ->line($body);
    }

    public function toDatabase($notifiable): array
    {
        $template = NotificationTemplate::where('code', $this->templateCode)->first();
        if (!$template) {
            return [];
        }

        $body = $this->renderString($template->content['database'] ?? '', $this->variables);

        return [
            'template_code' => $this->templateCode,
            'title' => $template->name,
            'message' => $body,
            'variables' => $this->variables,
        ];
    }

    public function toSms($notifiable): ?string
    {
        $template = NotificationTemplate::where('code', $this->templateCode)->first();
        if (!$template || !in_array('sms', $template->channels)) {
            return null;
        }

        return $this->renderString($template->content['sms'] ?? '', $this->variables);
    }

    protected function renderString(string $string, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $string = str_replace('{{' . $key . '}}', (string) $value, $string);
            $string = str_replace('{{ ' . $key . ' }}', (string) $value, $string);
        }
        return $string;
    }
}
