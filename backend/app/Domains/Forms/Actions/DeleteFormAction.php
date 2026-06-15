<?php

namespace App\Domains\Forms\Actions;

use App\Domains\Forms\Models\Form;

class DeleteFormAction
{
    public function execute(Form $form): void
    {
        $form->delete();
    }
}
