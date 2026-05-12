<?php

namespace Tests\Feature\UserDomain\Otp;

use App\Domains\User\Models\LoginOtp;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class VerifyOtpEndpointTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/auth/otp/verify';
    private const TEST_PHONE = '+905551112233';
    private const TEST_CODE = '123456';

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        RateLimiter::clear('otp-verify|' . sha1('127.0.0.1|' . self::TEST_PHONE));
    }

    /** TC-01: Verify Success */
    public function test_tc01_verify_success(): void
    {
        $user = User::factory()->create([
            'phone' => self::TEST_PHONE,
            'phone_verified_at' => null,
        ]);

        LoginOtp::factory()->create([
            'user_id' => $user->id,
            'phone' => self::TEST_PHONE,
            'code_hash' => Hash::make(self::TEST_CODE),
            'consumed_at' => null,
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
            'max_attempts' => 5,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'phone' => self::TEST_PHONE,
            'code' => self::TEST_CODE,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'token', 'user']);

        $this->assertNotNull($user->refresh()->phone_verified_at);
        $this->assertNotNull(LoginOtp::query()->latest('id')->first()->consumed_at);
    }

    /** TC-02: Verify Invalid Code */
    public function test_tc02_verify_invalid_code(): void
    {
        LoginOtp::factory()->create([
            'phone' => self::TEST_PHONE,
            'code_hash' => Hash::make(self::TEST_CODE),
            'attempts' => 0,
            'max_attempts' => 5,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'phone' => self::TEST_PHONE,
            'code' => 'wrong',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('error_code', 'AUTH.OTP_INVALID');

        $this->assertSame(1, LoginOtp::query()->latest('id')->first()->attempts);
    }

    /** TC-03: Verify Max Attempts */
    public function test_tc03_verify_max_attempts(): void
    {
        LoginOtp::factory()->create([
            'phone' => self::TEST_PHONE,
            'code_hash' => Hash::make(self::TEST_CODE),
            'attempts' => 4,
            'max_attempts' => 5,
            'consumed_at' => null,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'phone' => self::TEST_PHONE,
            'code' => 'wrong-again',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('error_code', 'AUTH.OTP_MAX_ATTEMPTS');

        $otp = LoginOtp::query()->latest('id')->first();
        $this->assertSame(5, $otp->attempts);
        $this->assertNotNull($otp->consumed_at);
    }

    /** TC-04: Verify Expired OTP */
    public function test_tc04_verify_expired_otp(): void
    {
        LoginOtp::factory()->create([
            'phone' => self::TEST_PHONE,
            'code_hash' => Hash::make(self::TEST_CODE),
            'expires_at' => now()->subMinute(),
            'consumed_at' => null,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'phone' => self::TEST_PHONE,
            'code' => self::TEST_CODE,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('error_code', 'AUTH.OTP_EXPIRED');
    }

    /** TC-06: Verify Rate Limited */
    public function test_tc06_verify_rate_limited(): void
    {
        // IP based throttle test
        for ($i = 0; $i < 5; $i++) {
            $this->postJson(self::ENDPOINT, [
                'phone' => self::TEST_PHONE,
                'code' => 'any',
            ]);
        }

        $sixth = $this->postJson(self::ENDPOINT, [
            'phone' => self::TEST_PHONE,
            'code' => 'any',
        ]);

        $sixth->assertStatus(429)
            ->assertJsonPath('error_code', 'AUTH.OTP_VERIFY_RATE_LIMITED');
    }

    /** TC-10: Audit Log Written */
    public function test_tc10_audit_log_written(): void
    {
        $user = User::factory()->create(['phone' => self::TEST_PHONE]);
        LoginOtp::factory()->create([
            'user_id' => $user->id,
            'phone' => self::TEST_PHONE,
            'code_hash' => Hash::make(self::TEST_CODE),
        ]);

        $this->postJson(self::ENDPOINT, [
            'phone' => self::TEST_PHONE,
            'code' => self::TEST_CODE,
        ]);

        $activity = Activity::query()
            ->where('log_name', 'user.otp')
            ->where('description', 'user.otp.verified')
            ->latest('id')
            ->first();

        $this->assertNotNull($activity);
        $this->assertSame($user->id, (int) $activity->properties['user_id']);
    }
}
