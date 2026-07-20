<?php

namespace Tests\Feature\IdentityDomain\Login;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class AuthLogoutTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/auth/logout';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /** TC-01 Logout Current Success */
    public function test_tc01_logout_current_success(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'scope' => 'current_only'
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.message', 'Oturumunuz başarıyla kapatıldı.')
            ->assertJsonPath('data.revoked_count', 1);

        $this->assertCount(0, $user->tokens);
    }

    /** TC-03 Revoke All Self Success */
    public function test_tc03_revoke_all_self_success(): void
    {
        $user = User::factory()->create();
        $user->createToken('device-1');
        $user->createToken('device-2');
        $token = $user->createToken('device-3')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'scope' => 'all_devices'
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.revoked_count', 3);

        $this->assertCount(0, $user->refresh()->tokens);
    }

    /** TC-04 Revoke All Except Current */
    public function test_tc04_revoke_all_except_current(): void
    {
        $user = User::factory()->create();
        $user->createToken('other-1');
        $user->createToken('other-2');
        $token = $user->createToken('current')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'scope' => 'all_except_current'
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.revoked_count', 2);

        $this->assertCount(1, $user->refresh()->tokens);
    }

    /** TC-05 Admin Revoke Forbidden (Hierarchy Check) */
    public function test_tc05_admin_revoke_forbidden_by_hierarchy(): void
    {
        $adminUser = User::factory()->create();
        $adminUser->assignRole('admin'); // Weight 50

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super_admin'); // Weight 100
        $superAdmin->createToken('super-session');

        $token = $adminUser->createToken('admin-token')->plainTextToken;

        // Admin, Super Admin'i atmaya çalışıyor
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'scope' => 'all_devices',
                'target_user_id' => $superAdmin->id
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'AUTH.FORBIDDEN');

        $this->assertCount(1, $superAdmin->refresh()->tokens);
    }

    /** TC-06 Admin Revoke Success */
    public function test_tc06_admin_revoke_success(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super_admin');

        $targetUser = User::factory()->create();
        $targetUser->assignRole('user');
        $targetUser->createToken('user-session');

        $token = $superAdmin->createToken('super-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'scope' => 'all_devices',
                'target_user_id' => $targetUser->id
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.revoked_count', 1);

        $this->assertCount(0, $targetUser->refresh()->tokens);
    }

    /** TC-07 Unauthorized Request */
    public function test_tc07_unauthorized_request(): void
    {
        $this->postJson(self::ENDPOINT, ['scope' => 'current_only'])
            ->assertStatus(401)
            ->assertJsonPath('error_code', 'AUTH.UNAUTHORIZED');
    }

    /** TC-08 Token Reuse Blocked */
    public function test_tc08_token_reuse_blocked(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        // Logout yap
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, ['scope' => 'current_only'])
            ->assertStatus(200);

        // Guard'ı temizle (Test ortamında state kalmaması için)
        auth()->forgetGuards();

        // Aynı token ile tekrar dene
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user')
            ->assertStatus(401);
    }

    /** TC-09 Audit Log Created */
    public function test_tc09_audit_log_created(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'scope' => 'all_devices',
                'reason' => 'Security Audit'
            ]);

        $activity = Activity::query()
            ->where('log_name', 'user.auth')
            ->where('description', 'like', '%Kullanıcı çıkış yaptı%')
            ->latest('id')
            ->first();

        $this->assertNotNull($activity);
        $this->assertSame('all_devices', $activity->properties['scope']);
        $this->assertSame('Security Audit', $activity->properties['reason']);
    }
}
