<?php

namespace Tests\Feature\IdentityDomain\Admin;

use App\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserImpersonationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /** @test */
    public function admin_can_impersonate_user_and_get_token(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $target = User::factory()->create(['name' => 'Target User']);

        $response = $this->actingAs($admin)
            ->postJson("/api/admin/users/{$target->id}/impersonate");

        $response->assertStatus(200)
            ->assertJsonStructure(['access_token']);

        $token = $response->json('access_token');

        // P0: Deep clear the authenticated user
        \Illuminate\Support\Facades\Auth::forgetUser();
        $this->app->forgetInstance('auth');
        
        $profileResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/profile');

        $profileResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Target User');
    }

    /** @test */
    public function non_admin_cannot_impersonate_user(): void
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $target = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson("/api/admin/users/{$target->id}/impersonate");

        $response->assertStatus(403);
    }
}
