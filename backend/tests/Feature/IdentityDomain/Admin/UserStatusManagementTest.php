<?php

namespace Tests\Feature\IdentityDomain\Admin;

use App\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserStatusManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /** @test */
    public function admin_can_block_user_and_revoke_their_sessions(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $target = User::factory()->create(['status' => User::STATUS_ACTIVE]);
        $targetToken = $target->createToken('target-session')->plainTextToken;

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$target->id}/status", [
                'status' => User::STATUS_BLOCKED
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', User::STATUS_BLOCKED);

        // P0: Verify target user's tokens are revoked
        $this->assertCount(0, $target->refresh()->tokens);
    }

    /** @test */
    public function non_admin_cannot_change_user_status(): void
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $target = User::factory()->create();

        $response = $this->actingAs($user)
            ->patchJson("/api/admin/users/{$target->id}/status", [
                'status' => User::STATUS_BLOCKED
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function admin_can_reactivate_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $target = User::factory()->create(['status' => User::STATUS_BLOCKED]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$target->id}/status", [
                'status' => User::STATUS_ACTIVE
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', User::STATUS_ACTIVE);
    }
}
