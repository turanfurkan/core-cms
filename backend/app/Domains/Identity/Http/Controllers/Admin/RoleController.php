<?php

namespace App\Domains\Identity\Http\Controllers\Admin;

use App\Domains\Identity\Actions\Users\ListRolesAction;
use App\Domains\Identity\Http\Resources\RoleResource;
use App\Domains\Identity\Models\Role;
use App\Domains\Identity\Models\Permission;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class RoleController extends Controller
{
    public function index(ListRolesAction $action): AnonymousResourceCollection
    {
        Gate::authorize('role.assign');

        $roles = $action->execute();

        return RoleResource::collection($roles);
    }

    public function show(string $id): RoleResource
    {
        Gate::authorize('role.assign');

        $role = Role::findOrFail($id);

        return new RoleResource($role);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('role.assign');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'description' => ['nullable', 'string'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        $role = DB::transaction(function () use ($validated) {
            $role = Role::create([
                'name' => $validated['slug'], // Spatie role name is the slug/identifier
                'description' => $validated['description'] ?? null,
                'guard_name' => 'web',
            ]);

            // Create matching API guard role too for API security compatibility
            $apiRole = Role::firstOrCreate([
                'name' => $validated['slug'],
                'guard_name' => 'api'
            ]);

            if (!empty($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
                // Sync permissions for API role too
                $apiPermissions = Permission::whereIn('id', $validated['permissions'])
                    ->orWhereIn('name', $validated['permissions'])
                    ->where('guard_name', 'api')
                    ->pluck('name')
                    ->toArray();
                $apiRole->syncPermissions($apiPermissions);
            }

            return $role;
        });

        return response()->json([
            'message' => 'Role created successfully.',
            'data' => new RoleResource($role)
        ], 201);
    }

    public function update(string $id, Request $request): JsonResponse
    {
        Gate::authorize('role.assign');

        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'description' => ['nullable', 'string'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        DB::transaction(function () use ($role, $validated) {
            // Update web guard role
            $role->update([
                'name' => $validated['slug'],
                'description' => $validated['description'] ?? null,
            ]);

            // Also update the api guard counterpart if exists
            $apiRole = Role::where('name', $role->getOriginal('name'))->where('guard_name', 'api')->first();
            if ($apiRole) {
                $apiRole->update([
                    'name' => $validated['slug'],
                ]);
            }

            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
                if ($apiRole) {
                    // Sync permissions for API role too
                    $apiPermissions = Permission::whereIn('id', $validated['permissions'])
                        ->orWhereIn('name', $validated['permissions'])
                        ->where('guard_name', 'api')
                        ->pluck('name')
                        ->toArray();
                    $apiRole->syncPermissions($apiPermissions);
                }
            }
        });

        return response()->json([
            'message' => 'Role updated successfully.',
            'data' => new RoleResource($role->fresh())
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('role.assign');

        $role = Role::findOrFail($id);

        if ($role->is_protected) {
            return response()->json([
                'message' => 'Cannot delete a protected system role.'
            ], 403);
        }

        // Check if assigned to any user
        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'Role is assigned to users and cannot be deleted.'
            ], 403);
        }

        DB::transaction(function () use ($role) {
            // Delete api guard role if exists
            Role::where('name', $role->name)->where('guard_name', 'api')->delete();
            $role->delete();
        });

        return response()->json([
            'message' => 'Role deleted successfully.'
        ]);
    }

    public function setDefault(string $id): JsonResponse
    {
        Gate::authorize('role.assign');

        $role = Role::findOrFail($id);

        DB::transaction(function () use ($role) {
            // Unset other default roles for both web and api guards
            Role::where('is_default', true)->update(['is_default' => false]);
            
            // Set this role as default (both guards)
            Role::where('name', $role->name)->update(['is_default' => true]);
        });

        return response()->json([
            'message' => 'Role set as default successfully.'
        ]);
    }
}
