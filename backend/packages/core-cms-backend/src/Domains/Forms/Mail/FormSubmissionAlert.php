<?php

namespace TuranFurkan\CoreCms\Domains\Forms\Mail;

use TuranFurkan\CoreCms\Domains\Forms\Models\FormSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FormSubmissionAlert extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly FormSubmission $submission
    ) {}

    public function envelope(): Envelope
    {
        $formTitle = $this->submission->form->title;
        return new Envelope(
            subject: "Yeni Form Gönderimi: {$formTitle}",
        );
    }

    public function content(): Content
    {
        // Get fields with labels for rendering
        $fields = $this->submission->form->fields;
        $submissionData = $this->submission->data;

        $formattedFields = [];
        foreach ($fields as $field) {
            $value = $submissionData[$field->name] ?? '';
            
            // Handle display if value is a file upload array
            if (is_array($value) && isset($value['original_name'], $value['url'])) {
                $value = "<a href='{$value['url']}' target='_blank'>{$value['original_name']} (Dosyayı Görüntüle)</a>";
            } elseif (is_array($value)) {
                $value = implode(', ', $value);
            }

            $formattedFields[] = [
                'label' => $field->label,
                'value' => $value,
            ];
        }

        return new Content(
            view: 'emails.form_submission_alert',
            with: [
                'formTitle' => $this->submission->form->title,
                'submittedAt' => $this->submission->created_at->format('Y-m-d H:i:s'),
                'ipAddress' => $this->submission->ip_address,
                'fields' => $formattedFields,
            ],
        );
    }
}
