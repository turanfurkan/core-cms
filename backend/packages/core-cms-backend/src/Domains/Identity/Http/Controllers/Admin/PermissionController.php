<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Identity\Actions\Users\ListPermissionsAction;
use TuranFurkan\CoreCms\Domains\Identity\Http\Resources\PermissionResource;
use TuranFurkan\CoreCms\Domains\Identity\Models\Permission;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class PermissionController extends Controller
{
    public function index(ListPermissionsAction $action): AnonymousResourceCollection
    {
        Gate::authorize('role.assign');

        $permissions = $action->execute();

        return PermissionResource::collection($permissions);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('role.assign');

        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:255', 'unique:permissions,name'],
            'description' => ['nullable', 'string'],
        ]);

        $slug = $validated['slug'];

        $permission = DB::transaction(function () use ($slug, $validated) {
            // Create for web guard
            $webPermission = Permission::create([
                'name' => $slug,
                'guard_name' => 'web',
                'description' => $validated['description'] ?? null,
            ]);

            // Create matching API guard permission
            Permission::firstOrCreate([
                'name' => $slug,
                'guard_name' => 'api',
            ], [
                'description' => $validated['description'] ?? null,
            ]);

            return $webPermission;
        });

        return response()->json([
            'message' => 'Permission created successfully.',
            'data' => new PermissionResource($permission)
        ], 201);
    }

    public function show(string $id): PermissionResource
    {
        Gate::authorize('role.assign');

        $permission = Permission::findOrFail($id);

        return new PermissionResource($permission);
    }

    public function update(string $id, Request $request): JsonResponse
    {
        Gate::authorize('role.assign');

        $permission = Permission::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($permission, $validated) {
            // Update this permission (web guard)
            $permission->update([
                'description' => $validated['description'] ?? null,
            ]);

            // If there's an api guard counterpart, update description there too
            $apiPermission = Permission::where('name', $permission->name)->where('guard_name', 'api')->first();
            if ($apiPermission) {
                $apiPermission->update([
                    'description' => $validated['description'] ?? null,
                ]);
            }
        });

        return response()->json([
            'message' => 'Permission updated successfully.',
            'data' => new PermissionResource($permission->fresh())
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('role.assign');

        $permission = Permission::findOrFail($id);

        DB::transaction(function () use ($permission) {
            // Delete api counterpart
            Permission::where('name', $permission->name)->where('guard_name', 'api')->delete();
            $permission->delete();
        });

        return response()->json([
            'message' => 'Permission deleted successfully.'
        ]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        Gate::authorize('role.assign');

        $validated = $request->validate([
            'permission_ids' => ['required', 'array'],
            'permission_ids.*' => ['required', 'string'],
        ]);

        $ids = $validated['permission_ids'];

        if (count($ids) > 2) {
            return response()->json([
                'message' => 'You cannot delete more than 2 records at once.'
            ], 400);
        }

        DB::transaction(function () use ($ids) {
            $names = Permission::whereIn('id', $ids)->pluck('name')->toArray();
            
            // Delete web and api counterparts
            Permission::whereIn('name', $names)->delete();
        });

        return response()->json([
            'message' => 'Selected permissions deleted successfully.'
        ]);
    }
}
