<?php

namespace Tests\Feature\IdentityDomain\Register;

use TuranFurkan\CoreCms\Domains\Identity\Events\UserRegistered;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminRegisterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_tc06_unauthenticated_user_is_rejected(): void
    {
        $response = $this->postJson('/api/admin/users', [
            'name' => 'Anyone',
            'phone' => '+905551115500',
            'password' => 'StrongPass1',
            'role' => 'editor',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('error_code', 'AUTH.UNAUTHORIZED');
    }

    public function test_tc06_unauthorized_user_gets_403(): void
    {
        $regular = User::factory()->create();
        $regular->assignRole('user');

        Sanctum::actingAs($regular);

        $response = $this->postJson('/api/admin/users', [
            'name' => 'Anyone',
            'phone' => '+905551115501',
            'password' => 'StrongPass1',
            'role' => 'editor',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'AUTH.FORBIDDEN');
    }

    public function test_tc07_admin_can_register_editor(): void
    {
        Event::fake([UserRegistered::class]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/users', [
            'name' => 'New Editor',
            'phone' => '+905551116600',
            'email' => 'editor@example.com',
            'password' => 'StrongPass1',
            'role' => 'editor',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'user' => ['id', 'name', 'email', 'phone', 'roles']]);

        $created = User::where('phone', '+905551116600')->firstOrFail();
        $this->assertTrue($created->hasRole('editor'));

        Event::assertDispatched(UserRegistered::class, function (UserRegistered $event) use ($created, $admin) {
            return $event->user->id === $created->id
                && $event->registerChannel === 'admin'
                && $event->createdBy === $admin->id;
        });
    }

    public function test_tc08_admin_cannot_assign_super_admin(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/users', [
            'name' => 'Wannabe SuperAdmin',
            'phone' => '+905551117700',
            'password' => 'StrongPass1',
            'role' => 'super_admin',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'AUTH.ROLE_ASSIGNMENT_FORBIDDEN');
    }

    public function test_tc08_admin_cannot_assign_admin_role(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/users', [
            'name' => 'Wannabe Admin',
            'phone' => '+905551117711',
            'password' => 'StrongPass1',
            'role' => 'admin',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'AUTH.ROLE_ASSIGNMENT_FORBIDDEN');
    }

    public function test_super_admin_can_assign_admin(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super_admin');

        Sanctum::actingAs($superAdmin);

        $response = $this->postJson('/api/admin/users', [
            'name' => 'Trusted Admin',
            'phone' => '+905551118800',
            'password' => 'StrongPass1',
            'role' => 'admin',
        ]);

        $response->assertStatus(201);
        $created = User::where('phone', '+905551118800')->firstOrFail();
        $this->assertTrue($created->hasRole('admin'));
    }
}
