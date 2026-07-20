<?php

namespace Tests\Feature\IdentityDomain\Register;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class UserRegistrationAuditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        config(['user.register.require_otp_verification' => false]);
    }

    public function test_self_register_writes_audit_log(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Audit Self',
            'phone' => '+905551119900',
            'email' => 'audit@example.com',
            'password' => 'StrongPass1',
        ])->assertStatus(201);

        $activity = Activity::where('log_name', 'user.register')->latest()->first();

        $this->assertNotNull($activity, 'No audit log entry was created for self register.');
        $this->assertSame('user.registered', $activity->description);
        $properties = $activity->properties->toArray();
        $this->assertSame('self', $properties['register_channel'] ?? null);
        $this->assertArrayHasKey('created_by', $properties);
        $this->assertNull($properties['created_by']);
        $this->assertNotEquals('+905551119900', $properties['phone_masked'] ?? null);
        $this->assertNotEquals('audit@example.com', $properties['email_masked'] ?? null);
        $this->assertNotNull($properties['phone_masked'] ?? null);
        $this->assertNotNull($properties['email_masked'] ?? null);
    }

    public function test_admin_register_writes_audit_log(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/users', [
            'name' => 'Audit Admin',
            'phone' => '+905551119911',
            'email' => 'audit-admin@example.com',
            'password' => 'StrongPass1',
            'role' => 'editor',
        ])->assertStatus(201);

        $activity = Activity::where('log_name', 'user.register')->latest()->first();

        $this->assertNotNull($activity, 'No audit log entry was created for admin register.');
        $properties = $activity->properties->toArray();
        $this->assertSame('admin', $properties['register_channel'] ?? null);
        $this->assertSame($admin->id, $properties['created_by'] ?? null);
    }
}
