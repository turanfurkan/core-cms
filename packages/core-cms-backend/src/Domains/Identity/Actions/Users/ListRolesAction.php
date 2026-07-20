<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Users;

use Illuminate\Database\Eloquent\Collection;
use TuranFurkan\CoreCms\Domains\Identity\Models\Role;

class ListRolesAction
{
    public function execute(): Collection
    {
        return Role::where('guard_name', 'web')->get();
    }
}
