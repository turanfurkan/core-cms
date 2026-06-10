<?php

namespace App\Domains\Identity\Actions\Users;

use Illuminate\Database\Eloquent\Collection;
use App\Domains\Identity\Models\Permission;

class ListPermissionsAction
{
    public function execute(): Collection
    {
        return Permission::all();
    }
}
