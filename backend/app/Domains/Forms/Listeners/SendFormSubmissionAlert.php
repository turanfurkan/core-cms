<?php

namespace App\Domains\Forms\Listeners;

use App\Domains\Forms\Events\FormSubmitted;
use App\Domains\Forms\Mail\FormSubmissionAlert;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendFormSubmissionAlert implements ShouldQueue
{
    public function handle(FormSubmitted $event): void
    {
        $submission = $event->submission;
        $form = $submission->form;

        if ($form->recipient_email) {
            Mail::to($form->recipient_email)->send(new FormSubmissionAlert($submission));
        }
    }
}
