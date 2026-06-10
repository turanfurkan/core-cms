<?php

namespace App\Domains\Identity\Http\Controllers\Admin;

use App\Domains\Identity\Actions\Users\ListPermissionsAction;
use App\Domains\Identity\Http\Resources\PermissionResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class PermissionController extends Controller
{
    public function index(ListPermissionsAction $action): AnonymousResourceCollection
    {
        Gate::authorize('role.assign');

        $permissions = $action->execute();

        return PermissionResource::collection($permissions);
    }
}
