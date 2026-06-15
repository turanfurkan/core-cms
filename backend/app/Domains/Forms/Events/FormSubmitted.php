<?php

namespace App\Domains\Forms\Events;

use App\Domains\Forms\Models\FormSubmission;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FormSubmitted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly FormSubmission $submission
    ) {}
}
