<?php

namespace App\Domains\Identity\Actions\Users;

use Illuminate\Database\Eloquent\Collection;
use App\Domains\Identity\Models\Role;

class ListRolesAction
{
    public function execute(): Collection
    {
        return Role::all();
    }
}
