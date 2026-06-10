<?php

namespace Tests\Feature\IdentityDomain\Admin;

use App\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRoleManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /** @test */
    public function admin_can_sync_user_roles(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $target = User::factory()->create();
        $target->assignRole('user');

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$target->id}/roles", [
                'roles' => ['editor']
            ]);

        $response->assertStatus(200);

        // Verify target user's role updated
        $this->assertTrue($target->refresh()->hasRole('editor'));
        $this->assertFalse($target->hasRole('user')); // Old role should be removed by sync
    }

    /** @test */
    public function it_fails_if_role_does_not_exist(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $target = User::factory()->create();

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$target->id}/roles", [
                'roles' => ['non-existent-role']
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['roles.0']);
    }
}
