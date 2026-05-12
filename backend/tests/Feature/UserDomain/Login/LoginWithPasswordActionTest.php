<?php

namespace Tests\Feature\UserDomain\Login;

use App\Domains\User\Actions\LoginWithPasswordAction;
use App\Domains\User\Events\UserLoggedIn;
use App\Domains\User\Events\UserLoginFailed;
use App\Domains\User\Exceptions\LoginException;
use App\Domains\User\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class LoginWithPasswordActionTest extends TestCase
{
    use RefreshDatabase;

    private const PLAIN_PASSWORD = 'secret-password';
    private const TEST_IP = '127.0.0.1';
    private const TEST_AGENT = 'PHPUnit/UC02';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        // Reset all rate limiter buckets to keep tests isolated.
        RateLimiter::clear($this->throttleKey('+905551112233', self::TEST_IP));
        RateLimiter::clear($this->throttleKey('user@example.com', self::TEST_IP));
    }

    private function throttleKey(string $login, string $ip): string
    {
        return 'login|' . sha1($ip . '|' . mb_strtolower($login));
    }

    private function action(): LoginWithPasswordAction
    {
        return app(LoginWithPasswordAction::class);
    }

    /** TC-01: Email + correct password -> success + UserLoggedIn dispatched. */
    public function test_tc01_email_with_correct_password_succeeds(): void
    {
        $user = User::factory()->create([
            'email' => 'tc01@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        Event::fake([UserLoggedIn::class, UserLoginFailed::class]);

        $result = $this->action()->execute(
            login: 'tc01@example.com',
            loginType: LoginWithPasswordAction::TYPE_EMAIL,
            password: self::PLAIN_PASSWORD,
            ip: self::TEST_IP,
            userAgent: self::TEST_AGENT,
        );

        $this->assertSame($user->id, $result->id);

        Event::assertDispatched(UserLoggedIn::class, function (UserLoggedIn $event) use ($user) {
            return $event->user->id === $user->id
                && $event->loginMethod === UserLoggedIn::METHOD_PASSWORD
                && $event->ip === self::TEST_IP
                && $event->userAgent === self::TEST_AGENT;
        });
        Event::assertNotDispatched(UserLoginFailed::class);
    }

    /** TC-02: Phone + correct password -> success. */
    public function test_tc02_phone_with_correct_password_succeeds(): void
    {
        $user = User::factory()->create([
            'phone' => '+905551112233',
            'password' => self::PLAIN_PASSWORD,
        ]);

        Event::fake([UserLoggedIn::class]);

        $result = $this->action()->execute(
            login: '+905551112233',
            loginType: LoginWithPasswordAction::TYPE_PHONE,
            password: self::PLAIN_PASSWORD,
            ip: self::TEST_IP,
            userAgent: self::TEST_AGENT,
        );

        $this->assertSame($user->id, $result->id);

        Event::assertDispatched(UserLoggedIn::class, fn (UserLoggedIn $e) => $e->user->id === $user->id);
    }

    /** TC-03: Existing user + wrong password -> AUTH.INVALID_CREDENTIALS, reason=invalid_password. */
    public function test_tc03_invalid_password_throws_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'tc03@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        Event::fake([UserLoginFailed::class]);

        try {
            $this->action()->execute(
                login: 'tc03@example.com',
                loginType: LoginWithPasswordAction::TYPE_EMAIL,
                password: 'wrong-password',
                ip: self::TEST_IP,
                userAgent: self::TEST_AGENT,
            );
            $this->fail('Expected LoginException for invalid password.');
        } catch (LoginException $e) {
            $this->assertSame('AUTH.INVALID_CREDENTIALS', $e->errorCode);
            $this->assertSame(401, $e->statusCode);
            $this->assertNull($e->retryAfter);
        }

        Event::assertDispatched(UserLoginFailed::class, function (UserLoginFailed $event) use ($user) {
            return $event->reason === UserLoginFailed::REASON_INVALID_PASSWORD
                && $event->userId === $user->id
                && $event->identifier === 'tc03@example.com';
        });

        $this->assertSame(1, RateLimiter::attempts($this->throttleKey('tc03@example.com', self::TEST_IP)));
    }

    /** TC-04: Unknown identifier -> AUTH.INVALID_CREDENTIALS, reason=unknown_user. */
    public function test_tc04_unknown_identifier_throws_invalid_credentials(): void
    {
        Event::fake([UserLoginFailed::class]);

        try {
            $this->action()->execute(
                login: 'ghost@example.com',
                loginType: LoginWithPasswordAction::TYPE_EMAIL,
                password: 'whatever',
                ip: self::TEST_IP,
                userAgent: self::TEST_AGENT,
            );
            $this->fail('Expected LoginException for unknown user.');
        } catch (LoginException $e) {
            $this->assertSame('AUTH.INVALID_CREDENTIALS', $e->errorCode);
            $this->assertSame(401, $e->statusCode);
            $this->assertNull($e->retryAfter);
        }

        Event::assertDispatched(UserLoginFailed::class, function (UserLoginFailed $event) {
            return $event->reason === UserLoginFailed::REASON_UNKNOWN_USER
                && $event->userId === null
                && $event->identifier === 'ghost@example.com';
        });

        $this->assertSame(1, RateLimiter::attempts($this->throttleKey('ghost@example.com', self::TEST_IP)));
    }

    /**
     * Anti-enumeration: TC-03 (wrong password) and TC-04 (unknown user) must produce
     * the exact same error_code, message and statusCode at the action layer.
     */
    public function test_anti_enumeration_invalid_credentials_response_is_identical(): void
    {
        User::factory()->create([
            'email' => 'present@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $wrongPasswordEx = null;
        try {
            $this->action()->execute('present@example.com', LoginWithPasswordAction::TYPE_EMAIL, 'wrong', self::TEST_IP);
        } catch (LoginException $e) {
            $wrongPasswordEx = $e;
        }

        $unknownEx = null;
        try {
            $this->action()->execute('absent@example.com', LoginWithPasswordAction::TYPE_EMAIL, 'wrong', self::TEST_IP);
        } catch (LoginException $e) {
            $unknownEx = $e;
        }

        $this->assertNotNull($wrongPasswordEx);
        $this->assertNotNull($unknownEx);
        $this->assertSame($wrongPasswordEx->errorCode, $unknownEx->errorCode);
        $this->assertSame($wrongPasswordEx->getMessage(), $unknownEx->getMessage());
        $this->assertSame($wrongPasswordEx->statusCode, $unknownEx->statusCode);
        $this->assertSame($wrongPasswordEx->retryAfter, $unknownEx->retryAfter);
    }

    /** TC-05: 5 consecutive fails -> 6th throws AUTH.TOO_MANY_ATTEMPTS with retryAfter > 0. */
    public function test_tc05_too_many_attempts_after_threshold(): void
    {
        User::factory()->create([
            'email' => 'tc05@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        for ($i = 0; $i < 5; $i++) {
            try {
                $this->action()->execute('tc05@example.com', LoginWithPasswordAction::TYPE_EMAIL, 'wrong', self::TEST_IP);
                $this->fail('Expected LoginException on attempt ' . ($i + 1));
            } catch (LoginException $e) {
                $this->assertSame('AUTH.INVALID_CREDENTIALS', $e->errorCode);
            }
        }

        try {
            $this->action()->execute('tc05@example.com', LoginWithPasswordAction::TYPE_EMAIL, 'wrong', self::TEST_IP);
            $this->fail('Expected LoginException::tooManyAttempts on 6th attempt.');
        } catch (LoginException $e) {
            $this->assertSame('AUTH.TOO_MANY_ATTEMPTS', $e->errorCode);
            $this->assertSame(429, $e->statusCode);
            $this->assertNotNull($e->retryAfter);
            $this->assertGreaterThan(0, $e->retryAfter);
        }
    }

    /** TC-06a: status=blocked -> AUTH.ACCOUNT_LOCKED. */
    public function test_tc06a_blocked_user_is_locked(): void
    {
        $user = User::factory()->blocked()->create([
            'email' => 'tc06a@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        Event::fake([UserLoginFailed::class, UserLoggedIn::class]);

        try {
            $this->action()->execute('tc06a@example.com', LoginWithPasswordAction::TYPE_EMAIL, self::PLAIN_PASSWORD, self::TEST_IP);
            $this->fail('Expected LoginException::accountLocked.');
        } catch (LoginException $e) {
            $this->assertSame('AUTH.ACCOUNT_LOCKED', $e->errorCode);
            $this->assertSame(403, $e->statusCode);
        }

        Event::assertDispatched(UserLoginFailed::class, function (UserLoginFailed $event) use ($user) {
            return $event->reason === UserLoginFailed::REASON_ACCOUNT_LOCKED
                && $event->userId === $user->id;
        });
        Event::assertNotDispatched(UserLoggedIn::class);
    }

    /** TC-06b: status=suspended -> AUTH.ACCOUNT_LOCKED. */
    public function test_tc06b_suspended_user_is_locked(): void
    {
        $user = User::factory()->suspended()->create([
            'email' => 'tc06b@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        Event::fake([UserLoginFailed::class]);

        try {
            $this->action()->execute('tc06b@example.com', LoginWithPasswordAction::TYPE_EMAIL, self::PLAIN_PASSWORD, self::TEST_IP);
            $this->fail('Expected LoginException::accountLocked.');
        } catch (LoginException $e) {
            $this->assertSame('AUTH.ACCOUNT_LOCKED', $e->errorCode);
        }

        Event::assertDispatched(UserLoginFailed::class, function (UserLoginFailed $event) use ($user) {
            return $event->reason === UserLoginFailed::REASON_ACCOUNT_LOCKED
                && $event->userId === $user->id;
        });
    }

    /** TC-07: password=null -> AUTH.PASSWORD_LOGIN_DISABLED. */
    public function test_tc07_password_login_disabled_when_password_is_null(): void
    {
        $user = User::factory()->withoutPassword()->create([
            'email' => 'tc07@example.com',
        ]);

        Event::fake([UserLoginFailed::class, UserLoggedIn::class]);

        try {
            $this->action()->execute('tc07@example.com', LoginWithPasswordAction::TYPE_EMAIL, 'anything', self::TEST_IP);
            $this->fail('Expected LoginException::passwordLoginDisabled.');
        } catch (LoginException $e) {
            $this->assertSame('AUTH.PASSWORD_LOGIN_DISABLED', $e->errorCode);
            $this->assertSame(403, $e->statusCode);
        }

        Event::assertDispatched(UserLoginFailed::class, function (UserLoginFailed $event) use ($user) {
            return $event->reason === UserLoginFailed::REASON_PASSWORD_LOGIN_DISABLED
                && $event->userId === $user->id;
        });
        Event::assertNotDispatched(UserLoggedIn::class);
    }

    /** TC-08a: Successful login produces a `user.login.success` activity log entry. */
    public function test_tc08a_success_audit_log_entry_is_created(): void
    {
        $user = User::factory()->create([
            'email' => 'tc08a@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        $this->action()->execute(
            login: 'tc08a@example.com',
            loginType: LoginWithPasswordAction::TYPE_EMAIL,
            password: self::PLAIN_PASSWORD,
            ip: self::TEST_IP,
            userAgent: self::TEST_AGENT,
        );

        $activity = Activity::query()
            ->where('log_name', 'user.login')
            ->where('description', 'user.login.success')
            ->latest('id')
            ->first();

        $this->assertNotNull($activity, 'Expected user.login.success activity log entry.');
        $this->assertSame($user->id, (int) $activity->causer_id);
        $this->assertSame($user->id, (int) $activity->subject_id);

        $properties = $activity->properties->toArray();
        $this->assertSame(UserLoggedIn::METHOD_PASSWORD, $properties['login_method']);
        $this->assertSame(self::TEST_IP, $properties['ip']);
        $this->assertSame(self::TEST_AGENT, $properties['user_agent']);
    }

    /** TC-08b: Failed login produces `user.login.failed` audit log with masked identifier. */
    public function test_tc08b_failed_audit_log_masks_identifier(): void
    {
        User::factory()->create([
            'email' => 'tc08b@example.com',
            'password' => self::PLAIN_PASSWORD,
        ]);

        try {
            $this->action()->execute(
                login: 'tc08b@example.com',
                loginType: LoginWithPasswordAction::TYPE_EMAIL,
                password: 'wrong',
                ip: self::TEST_IP,
                userAgent: self::TEST_AGENT,
            );
            $this->fail('Expected LoginException for invalid password.');
        } catch (LoginException) {
            // Expected.
        }

        $activity = Activity::query()
            ->where('log_name', 'user.login')
            ->where('description', 'user.login.failed')
            ->latest('id')
            ->first();

        $this->assertNotNull($activity, 'Expected user.login.failed activity log entry.');

        $properties = $activity->properties->toArray();
        $this->assertSame(UserLoginFailed::REASON_INVALID_PASSWORD, $properties['reason']);
        $this->assertSame(self::TEST_IP, $properties['ip']);
        $this->assertSame(self::TEST_AGENT, $properties['user_agent']);
        $this->assertArrayHasKey('identifier_masked', $properties);
        $this->assertNotSame('tc08b@example.com', $properties['identifier_masked']);
        $this->assertStringContainsString('@example.com', $properties['identifier_masked']);
    }
}
