<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'user.viewAny',
            'user.view.any',
            'user.create',
            'user.create.staff',
            'user.update.any',
            'user.delete',
            'user.revoke',
            'role.assign',
            'role.assign.admin',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'api']);
        }

        $rolesMap = [
            'super_admin' => $permissions,
            'admin' => [
                'user.viewAny',
                'user.view.any',
                'user.create',
                'user.create.staff',
                'user.update.any',
                'user.delete',
                'user.revoke',
                'role.assign',
            ],
            'editor' => [
                'user.viewAny',
                'user.view.any',
            ],
            'user' => [],
        ];

        foreach (['web', 'api'] as $guard) {
            foreach ($rolesMap as $roleName => $rolePermissions) {
                $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => $guard]);

                $resolved = Permission::query()
                    ->where('guard_name', $guard)
                    ->whereIn('name', $rolePermissions)
                    ->get();

                $role->syncPermissions($resolved);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
