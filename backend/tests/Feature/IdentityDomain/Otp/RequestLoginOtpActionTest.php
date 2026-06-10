<?php

namespace Tests\Feature\IdentityDomain\Otp;

use App\Domains\Identity\Actions\Authentication\RequestLoginOtpAction;
use App\Domains\Identity\Contracts\SmsGateway;
use App\Domains\Identity\Events\OtpDeliveryFailed;
use App\Domains\Identity\Events\OtpRequested;
use App\Domains\Identity\Events\OtpRequestRateLimited;
use App\Domains\Identity\Exceptions\OtpException;
use App\Domains\Identity\Models\LoginOtp;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Sms\FakeSmsGateway;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RequestLoginOtpActionTest extends TestCase
{
    use RefreshDatabase;

    private const TEST_PHONE = '+905551112233';
    private const TEST_IP = '127.0.0.1';
    private const TEST_AGENT = 'PHPUnit/UC03';

    private FakeSmsGateway $fakeSms;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        Cache::flush();

        $this->fakeSms = new FakeSmsGateway();
        $this->app->instance(SmsGateway::class, $this->fakeSms);
    }

    private function action(): RequestLoginOtpAction
    {
        return app(RequestLoginOtpAction::class);
    }

    /** TC-01: Geçerli phone => OTP kaydı, delivery_status='sent', SMS gönderildi. */
    public function test_tc01_otp_send_success(): void
    {
        Event::fake([OtpRequested::class]);

        $result = $this->action()->execute(
            phone: self::TEST_PHONE,
            ip: self::TEST_IP,
            userAgent: self::TEST_AGENT,
        );

        $this->assertSame(60, $result->retryAfter);
        $this->assertNotEmpty($result->requestId);

        $this->assertDatabaseCount('login_otps', 1);

        $otp = LoginOtp::query()->latest('id')->firstOrFail();
        $this->assertSame(self::TEST_PHONE, $otp->phone);
        $this->assertSame(LoginOtp::PURPOSE_LOGIN, $otp->purpose);
        $this->assertSame(LoginOtp::DELIVERY_SENT, $otp->delivery_status);
        $this->assertSame(self::TEST_IP, $otp->ip_address);
        $this->assertSame(self::TEST_AGENT, $otp->user_agent);
        $this->assertSame($result->requestId, $otp->request_id);

        $this->fakeSms->assertSentTo(self::TEST_PHONE);

        Event::assertDispatched(OtpRequested::class, function (OtpRequested $event) use ($result) {
            return $event->status === OtpRequested::STATUS_SENT
                && $event->channel === 'sms'
                && $event->ip === self::TEST_IP
                && $event->requestId === $result->requestId;
        });
    }

    /** TC-02: OTP yalniz hashed sakli, plaintext kolonu yok. */
    public function test_tc02_otp_stored_hashed_only(): void
    {
        $this->action()->execute(
            phone: self::TEST_PHONE,
            ip: self::TEST_IP,
        );

        $otp = LoginOtp::query()->latest('id')->firstOrFail();

        $this->assertNotEmpty($otp->code_hash);
        $this->assertStringStartsWith('$2y$', $otp->code_hash, 'Code hash must be a bcrypt hash.');
        // SMS contains the plaintext code; verify hash matches the message digits.
        $message = $this->fakeSms->lastMessage();
        $this->assertNotNull($message);
        preg_match('/(\d{6})/', $message, $matches);
        $this->assertNotEmpty($matches);
        $this->assertTrue(Hash::check($matches[1], $otp->code_hash));
    }

    /** TC-03: Yeni OTP gelir, eski aktif OTP'ler consumed_at=now() ile invalid edilir. */
    public function test_tc03_previous_otp_is_invalidated(): void
    {
        config(['user.otp.cooldown_seconds' => 0]);

        $first = $this->action()->execute(self::TEST_PHONE, self::TEST_IP);
        $firstOtp = LoginOtp::query()->where('request_id', $first->requestId)->firstOrFail();

        $this->assertNull($firstOtp->consumed_at);

        $second = $this->action()->execute(self::TEST_PHONE, self::TEST_IP);
        $firstOtp->refresh();
        $secondOtp = LoginOtp::query()->where('request_id', $second->requestId)->firstOrFail();

        $this->assertNotNull($firstOtp->consumed_at, 'Previous OTP must be consumed.');
        $this->assertNull($secondOtp->consumed_at, 'New OTP must remain active.');
        $this->assertSame(2, LoginOtp::query()->count());
    }

    /** TC-04: expires_at = now + ttl_minutes (5dk default). */
    public function test_tc04_ttl_is_set(): void
    {
        $before = now();
        $this->action()->execute(self::TEST_PHONE, self::TEST_IP);
        $after = now();

        $otp = LoginOtp::query()->latest('id')->firstOrFail();

        $this->assertGreaterThanOrEqual($before->copy()->addMinutes(5)->subSecond(), $otp->expires_at);
        $this->assertLessThanOrEqual($after->copy()->addMinutes(5)->addSecond(), $otp->expires_at);
    }

    /** TC-05: attempts=0, max_attempts default config (5). */
    public function test_tc05_attempts_defaults(): void
    {
        $this->action()->execute(self::TEST_PHONE, self::TEST_IP);

        $otp = LoginOtp::query()->latest('id')->firstOrFail();

        $this->assertSame(0, (int) $otp->attempts);
        $this->assertSame(5, (int) $otp->max_attempts);
    }

    /** TC-07: Aynı phone için cooldown süresi içinde ikinci istek => cooldownActive. */
    public function test_tc07_cooldown_active_blocks_second_request(): void
    {
        Event::fake([OtpRequestRateLimited::class]);

        $this->action()->execute(self::TEST_PHONE, self::TEST_IP);

        try {
            $this->action()->execute(self::TEST_PHONE, self::TEST_IP);
            $this->fail('Expected OtpException::cooldownActive on the second request.');
        } catch (OtpException $e) {
            $this->assertSame('AUTH.OTP_COOLDOWN_ACTIVE', $e->errorCode);
            $this->assertSame(429, $e->statusCode);
            $this->assertNotNull($e->retryAfter);
            $this->assertGreaterThan(0, $e->retryAfter);
        }

        Event::assertDispatched(OtpRequestRateLimited::class, function (OtpRequestRateLimited $event) {
            return $event->reason === OtpRequestRateLimited::REASON_COOLDOWN
                && $event->retryAfter > 0;
        });

        // Second OTP record should NOT be created (action throws before persisting).
        $this->assertDatabaseCount('login_otps', 1);
    }

    /** TC-09: SMS delivery failure => OtpException::deliveryFailed + DB delivery_status=failed + event. */
    public function test_tc09_sms_delivery_failure(): void
    {
        Event::fake([OtpDeliveryFailed::class, OtpRequested::class]);

        $this->fakeSms->failNext();

        try {
            $this->action()->execute(self::TEST_PHONE, self::TEST_IP);
            $this->fail('Expected OtpException::deliveryFailed.');
        } catch (OtpException $e) {
            $this->assertSame('AUTH.OTP_DELIVERY_FAILED', $e->errorCode);
            $this->assertSame(502, $e->statusCode);
        }

        $otp = LoginOtp::query()->latest('id')->firstOrFail();
        $this->assertSame(LoginOtp::DELIVERY_FAILED, $otp->delivery_status);

        Event::assertDispatched(OtpDeliveryFailed::class, function (OtpDeliveryFailed $event) {
            return $event->provider === 'fake'
                && $event->errorCode === 'fake.delivery_failed';
        });
        Event::assertNotDispatched(OtpRequested::class);
    }

    /** Bonus: User varsa user_id otomatik bağlanir. */
    public function test_user_id_attached_when_user_exists(): void
    {
        $user = User::factory()->create([
            'phone' => self::TEST_PHONE,
        ]);

        $this->action()->execute(self::TEST_PHONE, self::TEST_IP);

        $otp = LoginOtp::query()->latest('id')->firstOrFail();
        $this->assertSame($user->id, (int) $otp->user_id);
    }

    /** Anti-enumeration smoke: var olmayan phone'a OTP da basariyla olusur (user_id null). */
    public function test_unknown_phone_still_creates_otp_with_null_user_id(): void
    {
        $this->action()->execute('+905559998877', self::TEST_IP);

        $otp = LoginOtp::query()->latest('id')->firstOrFail();
        $this->assertNull($otp->user_id);
        $this->assertSame(LoginOtp::DELIVERY_SENT, $otp->delivery_status);
    }
}
