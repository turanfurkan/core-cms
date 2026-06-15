<?php

namespace App\Domains\Navigation\Actions;

use App\Domains\Navigation\Models\Navigation;

class DeleteNavigationAction
{
    public function execute(Navigation $navigation): void
    {
        $navigation->delete();
    }
}
