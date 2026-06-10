<?php

namespace App\Domains\Identity\Http\Controllers\Admin;

use App\Domains\Identity\Actions\Users\ListRolesAction;
use App\Domains\Identity\Http\Resources\RoleResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class RoleController extends Controller
{
    public function index(ListRolesAction $action): AnonymousResourceCollection
    {
        Gate::authorize('role.assign');

        $roles = $action->execute();

        return RoleResource::collection($roles);
    }
}
