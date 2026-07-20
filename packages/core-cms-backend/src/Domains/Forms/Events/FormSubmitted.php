<?php

namespace TuranFurkan\CoreCms\Domains\Forms\Events;

use TuranFurkan\CoreCms\Domains\Forms\Models\FormSubmission;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FormSubmitted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly FormSubmission $submission
    ) {}
}
