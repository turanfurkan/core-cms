<?php

namespace Tests\Feature\IdentityDomain\Login;

use App\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class LoginEndpointTest extends TestCase
{
    use RefreshDatabase;

    private const PLAIN_PASSWORD = 'secret-password';
    private const ENDPOINT = '/api/auth/login';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        // Reset both HTTP throttle (named 'login') and domain RateLimiter buckets.
        Cache::flush();
    }

    /** TC-H01: Email + correct password -> 200 + token + user resource. */
    public function test_h01_email_login_returns_token_and_user(): void
    {
        $user = User::factory()->create([
            'email' => 'h01@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'login' => 'h01@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'token', 'user' => ['id', 'name', 'email', 'phone', 'roles']])
            ->assertJsonPath('user.id', $user->id);

        $this->assertNotEmpty($response->json('token'));
    }

    /** TC-H02: Phone (E.164 normalize edilmis) + correct password -> 200 + token. */
    public function test_h02_phone_login_returns_token_and_user(): void
    {
        $user = User::factory()->create([
            'phone' => '+905551112233',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'login' => '+905551112233',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.id', $user->id);

        $this->assertNotEmpty($response->json('token'));
    }

    /** TC-H03: Existing user, wrong password -> 401 AUTH.INVALID_CREDENTIALS. */
    public function test_h03_invalid_password_returns_401(): void
    {
        User::factory()->create([
            'email' => 'h03@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'login' => 'h03@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('error_code', 'AUTH.INVALID_CREDENTIALS');
    }

    /**
     * TC-H04 (anti-enumeration): Unknown identifier returns the same JSON body
     * (error_code, message, status) as wrong-password (TC-H03).
     */
    public function test_h04_unknown_identifier_matches_invalid_password_body(): void
    {
        User::factory()->create([
            'email' => 'present@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $wrongPassword = $this->postJson(self::ENDPOINT, [
            'login' => 'present@example.com',
            'password' => 'wrong-password',
        ]);

        // Flush cache so the unknown-identifier attempt does not collide with the
        // domain-layer counter from the wrong-password attempt above.
        Cache::flush();

        $unknown = $this->postJson(self::ENDPOINT, [
            'login' => 'absent@example.com',
            'password' => 'wrong-password',
        ]);

        $wrongPassword->assertStatus(401);
        $unknown->assertStatus(401);

        $this->assertSame(
            $wrongPassword->json('error_code'),
            $unknown->json('error_code'),
        );
        $this->assertSame(
            $wrongPassword->json('message'),
            $unknown->json('message'),
        );
        $this->assertSame(
            $wrongPassword->getStatusCode(),
            $unknown->getStatusCode(),
        );
    }

    /** TC-H05: 6th attempt -> 429 + AUTH.TOO_MANY_ATTEMPTS + Retry-After header (domain layer). */
    public function test_h05_too_many_attempts_returns_429_with_retry_after(): void
    {
        User::factory()->create([
            'email' => 'h05@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        for ($i = 0; $i < 5; $i++) {
            $resp = $this->postJson(self::ENDPOINT, [
                'login' => 'h05@example.com',
                'password' => 'wrong-password',
            ]);
            $resp->assertStatus(401);
        }

        $sixth = $this->postJson(self::ENDPOINT, [
            'login' => 'h05@example.com',
            'password' => 'wrong-password',
        ]);

        $sixth->assertStatus(429)
            ->assertJsonPath('error_code', 'AUTH.TOO_MANY_ATTEMPTS');

        $retryAfter = $sixth->json('retry_after');
        $this->assertIsInt($retryAfter);
        $this->assertGreaterThan(0, $retryAfter);

        $this->assertNotNull($sixth->headers->get('Retry-After'));
        $this->assertGreaterThan(0, (int) $sixth->headers->get('Retry-After'));
    }

    /** TC-H06a: status=blocked -> 403 AUTH.ACCOUNT_LOCKED. */
    public function test_h06a_blocked_user_returns_403(): void
    {
        User::factory()->blocked()->create([
            'email' => 'h06a@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'login' => 'h06a@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'AUTH.ACCOUNT_LOCKED');
    }

    /** TC-H06b: status=suspended -> 403 AUTH.ACCOUNT_LOCKED. */
    public function test_h06b_suspended_user_returns_403(): void
    {
        User::factory()->suspended()->create([
            'email' => 'h06b@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'login' => 'h06b@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'AUTH.ACCOUNT_LOCKED');
    }

    /** TC-H07: password=null -> 403 AUTH.PASSWORD_LOGIN_DISABLED. */
    public function test_h07_password_login_disabled_returns_403(): void
    {
        User::factory()->withoutPassword()->create([
            'email' => 'h07@example.com',
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'login' => 'h07@example.com',
            'password' => 'anything',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'AUTH.PASSWORD_LOGIN_DISABLED');
    }

    /** TC-H08: Invalid / missing input -> 422 ValidationException. */
    public function test_h08_validation_errors_return_422(): void
    {
        // Empty login
        $this->postJson(self::ENDPOINT, [
            'login' => '',
            'password' => 'something-long-enough',
        ])->assertStatus(422)->assertJsonValidationErrors(['login']);

        // Missing password
        $this->postJson(self::ENDPOINT, [
            'login' => 'someone@example.com',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);


        // Invalid identifier format
        $this->postJson(self::ENDPOINT, [
            'login' => 'not-email-not-phone',
            'password' => 'long-enough-pass',
        ])->assertStatus(422)->assertJsonValidationErrors(['login']);
    }

    /** TC-H09: HTTP named throttle ('login') trips on the 7th successful request within 1 minute. */
    public function test_h09_http_throttle_blocks_after_burst(): void
    {
        User::factory()->create([
            'email' => 'h09@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        // 6 successful logins (limit is per minute, default 6) should pass.
        for ($i = 0; $i < 6; $i++) {
            $resp = $this->postJson(self::ENDPOINT, [
                'login' => 'h09@example.com',
                'password' => self::PLAIN_PASSWORD,
            ]);
            $resp->assertStatus(200);
        }

        // 7th request hits the named limiter ceiling.
        $seventh = $this->postJson(self::ENDPOINT, [
            'login' => 'h09@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $seventh->assertStatus(429)
            ->assertJsonPath('error_code', 'AUTH.TOO_MANY_ATTEMPTS');
    }

    /** TC-H10: Successful login writes user.login.success activity entry with ip + user_agent. */
    public function test_h10_success_log_captures_ip_and_user_agent(): void
    {
        User::factory()->create([
            'email' => 'h10@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $this->withHeaders(['User-Agent' => 'PHPUnit/UC02-HTTP'])
            ->postJson(self::ENDPOINT, [
                'login' => 'h10@example.com',
                'password' => self::PLAIN_PASSWORD,
            ])
            ->assertStatus(200);

        $activity = Activity::query()
            ->where('log_name', 'user.login')
            ->where('description', 'user.login.success')
            ->latest('id')
            ->first();

        $this->assertNotNull($activity, 'Expected user.login.success activity entry.');

        $properties = $activity->properties->toArray();
        $this->assertSame('password', $properties['login_method']);
        $this->assertNotNull($properties['ip']);
        $this->assertSame('127.0.0.1', $properties['ip']);
        $this->assertSame('PHPUnit/UC02-HTTP', $properties['user_agent']);
    }
}
