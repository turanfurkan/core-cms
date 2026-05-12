<?php

namespace Tests\Feature\UserDomain\Otp;

use App\Domains\User\Contracts\SmsGateway;
use App\Domains\User\Models\LoginOtp;
use App\Domains\User\Models\User;
use App\Domains\User\Sms\FakeSmsGateway;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class SendOtpEndpointTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/auth/otp/send';
    private const TEST_PHONE = '+905551112233';

    private FakeSmsGateway $fakeSms;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        Cache::flush();

        $this->fakeSms = new FakeSmsGateway();
        $this->app->instance(SmsGateway::class, $this->fakeSms);
    }

    /** TC-H01 success body shape + DB persists OTP. */
    public function test_h01_send_otp_success(): void
    {
        $response = $this->postJson(self::ENDPOINT, [
            'phone' => self::TEST_PHONE,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'retry_after', 'request_id'])
            ->assertJsonPath('retry_after', 60);

        $this->assertNotEmpty($response->json('request_id'));
        $this->assertSame(1, LoginOtp::query()->count());

        $otp = LoginOtp::query()->latest('id')->firstOrFail();
        $this->assertSame(LoginOtp::DELIVERY_SENT, $otp->delivery_status);
    }

    /** TC-H02 validation 422 for empty/invalid phone. */
    public function test_h02_validation_errors(): void
    {
        $this->postJson(self::ENDPOINT, ['phone' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);

        $this->postJson(self::ENDPOINT, [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);

        $this->postJson(self::ENDPOINT, ['phone' => 'not-a-phone'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    /** TC-H03 anti-enumeration: known vs unknown phone produce same body shape. */
    public function test_h03_anti_enumeration_response_is_uniform(): void
    {
        config(['user.otp.cooldown_seconds' => 0]);

        User::factory()->create(['phone' => '+905552223344']);

        $known = $this->postJson(self::ENDPOINT, ['phone' => '+905552223344']);
        $unknown = $this->postJson(self::ENDPOINT, ['phone' => '+905559998877']);

        $known->assertStatus(200);
        $unknown->assertStatus(200);

        $this->assertSame(
            array_keys($known->json()),
            array_keys($unknown->json()),
            'Anti-enumeration: known/unknown phone responses must share the same JSON keys.',
        );
        $this->assertSame($known->json('message'), $unknown->json('message'));
        $this->assertSame($known->json('retry_after'), $unknown->json('retry_after'));
    }

    /** TC-H04 rate-limit: 3 success + 4th request returns 429 AUTH.OTP_RATE_LIMITED. */
    public function test_h04_rate_limit_after_three_requests(): void
    {
        config(['user.otp.cooldown_seconds' => 0]);

        for ($i = 0; $i < 3; $i++) {
            $this->postJson(self::ENDPOINT, ['phone' => self::TEST_PHONE])
                ->assertStatus(200);
        }

        $fourth = $this->postJson(self::ENDPOINT, ['phone' => self::TEST_PHONE]);

        $fourth->assertStatus(429)
            ->assertJsonPath('error_code', 'AUTH.OTP_RATE_LIMITED');
    }

    /** TC-H05 cooldown: second request within 60s returns 429 AUTH.OTP_COOLDOWN_ACTIVE + Retry-After header. */
    public function test_h05_cooldown_active(): void
    {
        $first = $this->postJson(self::ENDPOINT, ['phone' => self::TEST_PHONE]);
        $first->assertStatus(200);

        $second = $this->postJson(self::ENDPOINT, ['phone' => self::TEST_PHONE]);

        $second->assertStatus(429)
            ->assertJsonPath('error_code', 'AUTH.OTP_COOLDOWN_ACTIVE');

        $retryAfterJson = $second->json('retry_after');
        $this->assertIsInt($retryAfterJson);
        $this->assertGreaterThan(0, $retryAfterJson);

        $this->assertNotNull($second->headers->get('Retry-After'));
    }

    /** TC-H06 SMS delivery failure returns 502 + AUTH.OTP_DELIVERY_FAILED. */
    public function test_h06_sms_delivery_failure(): void
    {
        $this->fakeSms->failNext();

        $response = $this->postJson(self::ENDPOINT, ['phone' => self::TEST_PHONE]);

        $response->assertStatus(502)
            ->assertJsonPath('error_code', 'AUTH.OTP_DELIVERY_FAILED');

        $otp = LoginOtp::query()->latest('id')->firstOrFail();
        $this->assertSame(LoginOtp::DELIVERY_FAILED, $otp->delivery_status);
    }

    /** TC-H07 audit log entry exists with masked phone for successful send. */
    public function test_h07_audit_log_records_masked_phone(): void
    {
        $this->withHeaders(['User-Agent' => 'PHPUnit/UC03-OTP'])
            ->postJson(self::ENDPOINT, ['phone' => self::TEST_PHONE])
            ->assertStatus(200);

        $activity = Activity::query()
            ->where('log_name', 'user.otp')
            ->where('description', 'user.otp.requested')
            ->latest('id')
            ->first();

        $this->assertNotNull($activity, 'Expected user.otp.requested activity entry.');

        $properties = $activity->properties->toArray();
        $this->assertSame('sms', $properties['channel']);
        $this->assertSame('sent', $properties['status']);
        $this->assertSame('PHPUnit/UC03-OTP', $properties['user_agent']);
        $this->assertArrayHasKey('phone_masked', $properties);
        $this->assertNotSame(self::TEST_PHONE, $properties['phone_masked']);
    }
}
