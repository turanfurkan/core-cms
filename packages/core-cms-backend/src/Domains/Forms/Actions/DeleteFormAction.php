<?php

namespace TuranFurkan\CoreCms\Domains\Forms\Actions;

use TuranFurkan\CoreCms\Domains\Forms\Models\Form;

class DeleteFormAction
{
    public function execute(Form $form): void
    {
        $form->delete();
    }
}
