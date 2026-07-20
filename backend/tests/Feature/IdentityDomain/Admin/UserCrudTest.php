<?php

namespace Tests\Feature\IdentityDomain\Admin;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use TuranFurkan\CoreCms\Domains\Identity\Models\Role;
use TuranFurkan\CoreCms\Domains\Identity\Models\Permission;
use Tests\TestCase;

class UserCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /** @test */
    public function admin_can_list_users(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        User::factory()->count(15)->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/users?limit=10&page=1');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id', 'name', 'email', 'phone', 'status', 'role', 'roles', 'isTrashed'
                    ]
                ],
                'links',
                'meta'
            ]);
    }

    /** @test */
    public function admin_can_search_users(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $specialUser = User::factory()->create([
            'name' => 'John Doe Special',
            'email' => 'special@example.com'
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/users?query=special');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($specialUser->id, $response->json('data.0.id'));
    }

    /** @test */
    public function admin_can_show_user_details(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $target = User::factory()->create();

        $response = $this->actingAs($admin)
            ->getJson("/api/admin/users/{$target->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $target->id);
    }

    /** @test */
    public function admin_can_update_user_and_role(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $target = User::factory()->create();
        $target->assignRole('user');

        $response = $this->actingAs($admin)
            ->putJson("/api/admin/users/{$target->id}", [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
                'phone' => '+905555555555',
                'status' => 'suspended',
                'role' => 'editor',
            ]);

        $response->assertStatus(200);
        $target = $target->fresh();
        $this->assertEquals('Updated Name', $target->name);
        $this->assertEquals('updated@example.com', $target->email);
        $this->assertEquals('suspended', $target->status);
        $this->assertTrue($target->hasRole('editor'));
    }

    /** @test */
    public function admin_can_soft_delete_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $target = User::factory()->create();

        $response = $this->actingAs($admin)
            ->deleteJson("/api/admin/users/{$target->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('users', ['id' => $target->id]);
    }

    /** @test */
    public function admin_can_restore_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $target = User::factory()->create();
        $target->delete();

        $response = $this->actingAs($admin)
            ->postJson("/api/admin/users/{$target->id}/restore");

        $response->assertStatus(200);
        $this->assertNotSoftDeleted('users', ['id' => $target->id]);
        $this->assertEquals('active', $target->fresh()->status);
    }

    /** @test */
    public function regular_user_cannot_access_admin_user_crud(): void
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $target = User::factory()->create();

        $this->actingAs($user)->getJson('/api/admin/users')->assertStatus(403);
        $this->actingAs($user)->getJson("/api/admin/users/{$target->id}")->assertStatus(403);
        $this->actingAs($user)->putJson("/api/admin/users/{$target->id}", ['name' => 'Test'])->assertStatus(403);
        $this->actingAs($user)->deleteJson("/api/admin/users/{$target->id}")->assertStatus(403);
        $this->actingAs($user)->postJson("/api/admin/users/{$target->id}/restore")->assertStatus(403);
    }

    /** @test */
    public function admin_can_list_roles(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->getJson('/api/admin/roles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'name', 'guard_name']
                ]
            ]);
    }

    /** @test */
    public function admin_can_list_permissions(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->getJson('/api/admin/permissions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'name', 'guard_name']
                ]
            ]);
    }
}
