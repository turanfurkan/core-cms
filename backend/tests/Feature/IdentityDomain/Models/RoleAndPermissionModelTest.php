<?php

namespace Tests\Feature\IdentityDomain\Models;

use App\Domains\Identity\Models\Permission;
use App\Domains\Identity\Models\Role;
use App\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RoleAndPermissionModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    #[Test]
    public function custom_role_model_can_be_created_and_queried(): void
    {
        $role = Role::create([
            'name' => 'test_role',
            'guard_name' => 'web'
        ]);

        $this->assertInstanceOf(Role::class, $role);
        $this->assertEquals('test_role', $role->name);

        $found = Role::findByName('test_role', 'web');
        $this->assertInstanceOf(Role::class, $found);
        $this->assertEquals($role->id, $found->id);
    }

    #[Test]
    public function custom_permission_model_can_be_created_and_queried(): void
    {
        $permission = Permission::create([
            'name' => 'test_permission',
            'guard_name' => 'web'
        ]);

        $this->assertInstanceOf(Permission::class, $permission);
        $this->assertEquals('test_permission', $permission->name);

        $found = Permission::findByName('test_permission', 'web');
        $this->assertInstanceOf(Permission::class, $found);
        $this->assertEquals($permission->id, $found->id);
    }

    #[Test]
    public function permissions_can_be_assigned_to_role_using_custom_models(): void
    {
        $role = Role::create(['name' => 'custom_editor', 'guard_name' => 'web']);
        $permission1 = Permission::create(['name' => 'custom.edit', 'guard_name' => 'web']);
        $permission2 = Permission::create(['name' => 'custom.publish', 'guard_name' => 'web']);

        $role->givePermissionTo($permission1);
        $role->givePermissionTo($permission2->name);

        $this->assertTrue($role->hasPermissionTo('custom.edit'));
        $this->assertTrue($role->hasPermissionTo($permission2));

        $permissions = $role->permissions;
        $this->assertCount(2, $permissions);
        $this->assertInstanceOf(Permission::class, $permissions->first());
    }

    #[Test]
    public function package_uses_custom_models_configured_in_permission_config(): void
    {
        $this->assertEquals(Role::class, config('permission.models.role'));
        $this->assertEquals(Permission::class, config('permission.models.permission'));

        $roleInstance = app(\Spatie\Permission\Contracts\Role::class);
        $permissionInstance = app(\Spatie\Permission\Contracts\Permission::class);

        $this->assertInstanceOf(Role::class, $roleInstance);
        $this->assertInstanceOf(Permission::class, $permissionInstance);
    }

    #[Test]
    public function user_roles_relation_returns_custom_role_instances(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $userRole = $user->roles()->first();
        $this->assertInstanceOf(Role::class, $userRole);
        $this->assertEquals('admin', $userRole->name);
    }

    #[Test]
    public function user_permissions_relation_returns_custom_permission_instances(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo('user.create');

        $userPermission = $user->permissions()->first();
        $this->assertInstanceOf(Permission::class, $userPermission);
        $this->assertEquals('user.create', $userPermission->name);
    }
}
