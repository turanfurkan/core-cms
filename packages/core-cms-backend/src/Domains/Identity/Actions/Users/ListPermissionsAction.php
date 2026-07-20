<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Users;

use Illuminate\Database\Eloquent\Collection;
use TuranFurkan\CoreCms\Domains\Identity\Models\Permission;

class ListPermissionsAction
{
    public function execute(): Collection
    {
        return Permission::where('guard_name', 'web')->get();
    }
}
