<?php

namespace App\Providers;

use App\Domains\Identity\Actions\Authentication\LoginWithPasswordAction;
use App\Domains\Identity\Actions\Authentication\RequestLoginOtpAction;
use App\Domains\Identity\Contracts\SmsGateway;
use App\Domains\Identity\Events\OtpDeliveryFailed;
use App\Domains\Identity\Events\OtpRequested;
use App\Domains\Identity\Events\OtpRequestRateLimited;
use App\Domains\Identity\Events\OtpVerificationFailed;
use App\Domains\Identity\Events\OtpVerified;
use App\Domains\Identity\Events\UserLoggedIn;
use App\Domains\Identity\Events\UserLoggedOut;
use App\Domains\Identity\Events\UserLoginFailed;
use App\Domains\Identity\Events\UserRegistered;
use App\Domains\Identity\Listeners\LogFailedLogin;
use App\Domains\Identity\Listeners\LogLogoutActivity;
use App\Domains\Identity\Listeners\LogOtpDeliveryFailed;
use App\Domains\Identity\Listeners\LogOtpRateLimited;
use App\Domains\Identity\Listeners\LogOtpRequested;
use App\Domains\Identity\Listeners\LogOtpVerificationFailed;
use App\Domains\Identity\Listeners\LogOtpVerified;
use App\Domains\Identity\Listeners\LogRegisteredUser;
use App\Domains\Identity\Listeners\LogSuccessfulLogin;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Policies\UserPolicy;
use App\Domains\Identity\Sms\FakeSmsGateway;
use App\Domains\Identity\Sms\LogSmsGateway;
use App\Domains\Identity\Sms\NetgsmSmsGateway;
use App\Domains\Identity\Sms\TwilioSmsGateway;
use App\Domains\Identity\Support\OtpCodeGenerator;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        Schema::defaultStringLength(191);

        $this->app->bind(LoginWithPasswordAction::class, function ($app) {
            return new LoginWithPasswordAction(
                hasher: $app->make(Hasher::class),
                maxAttempts: (int) config('user.login.max_attempts', 5),
                decaySeconds: (int) config('user.login.decay_minutes', 15) * 60,
            );
        });

        $this->app->singleton(SmsGateway::class, function ($app) {
            return match ((string) config('user.otp.sms.driver', 'log')) {
                'fake' => new FakeSmsGateway(),
                'netgsm' => new NetgsmSmsGateway(
                    usercode: config('services.netgsm.usercode'),
                    password: config('services.netgsm.password'),
                    header: config('services.netgsm.header'),
                ),
                'twilio' => new TwilioSmsGateway(
                    sid: config('services.twilio.sid'),
                    authToken: config('services.twilio.auth_token'),
                    from: config('services.twilio.from'),
                ),
                default => new LogSmsGateway(),
            };
        });

        $this->app->bind(OtpCodeGenerator::class, function () {
            return new OtpCodeGenerator((int) config('user.otp.length', 6));
        });

        $this->app->bind(RequestLoginOtpAction::class, function ($app) {
            return new RequestLoginOtpAction(
                smsGateway: $app->make(SmsGateway::class),
                codeGenerator: $app->make(OtpCodeGenerator::class),
                hasher: $app->make(Hasher::class),
                maxAttempts: (int) config('user.otp.max_attempts', 5),
                ttlMinutes: (int) config('user.otp.ttl_minutes', 5),
                cooldownSeconds: (int) config('user.otp.cooldown_seconds', 60),
                rateLimitMax: (int) config('user.otp.rate_limit.max_requests', 3),
                rateLimitDecaySeconds: (int) config('user.otp.rate_limit.decay_minutes', 10) * 60,
                messageTemplate: (string) config('user.otp.message_template', 'CoreCMS giris kodunuz: :code'),
            );
        });
    }

    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);

        \Illuminate\Database\Eloquent\Relations\Relation::morphMap([
            'App\\Domains\\User\\Models\\User' => \App\Domains\Identity\Models\User::class,
            'App\\Domains\\Identity\\Models\\User' => \App\Domains\Identity\Models\User::class,
        ]);

        Event::listen(UserRegistered::class, LogRegisteredUser::class);
        Event::listen(UserLoggedIn::class, LogSuccessfulLogin::class);
        Event::listen(UserLoginFailed::class, LogFailedLogin::class);
        Event::listen(OtpRequested::class, LogOtpRequested::class);
        Event::listen(OtpRequestRateLimited::class, LogOtpRateLimited::class);
        Event::listen(OtpDeliveryFailed::class, LogOtpDeliveryFailed::class);
        Event::listen(OtpVerified::class, LogOtpVerified::class);
        Event::listen(OtpVerificationFailed::class, LogOtpVerificationFailed::class);
        Event::listen(UserLoggedOut::class, LogLogoutActivity::class);
        Event::listen(
            \App\Domains\Workflow\Events\WorkflowTransitioned::class,
            \App\Domains\Workflow\Listeners\AutoPublishContentListener::class
        );
        Event::listen(
            \App\Domains\Workflow\Events\WorkflowTransitioned::class,
            \App\Domains\Integration\Listeners\WebhookEventListener::class
        );
        Event::listen(
            \App\Domains\Forms\Events\FormSubmitted::class,
            \App\Domains\Forms\Listeners\SendFormSubmissionAlert::class
        );
        Event::listen(
            \App\Domains\Forms\Events\FormSubmitted::class,
            \App\Domains\Integration\Listeners\WebhookEventListener::class
        );
        Event::listen(UserRegistered::class, \App\Domains\Integration\Listeners\WebhookEventListener::class);

        $this->configureRateLimiters();
    }

    private function configureRateLimiters(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $login = (string) $request->input('login', '');
            $key = sha1(($request->ip() ?? 'no-ip') . '|' . mb_strtolower($login));

            return Limit::perMinute(
                (int) config('user.login.http_max_per_minute', 6)
            )->by($key)->response(function () {
                return response()->json([
                    'error_code' => 'AUTH.TOO_MANY_ATTEMPTS',
                    'message' => 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.',
                    'errors' => [],
                ], 429);
            });
        });

        RateLimiter::for('otp-send', function (Request $request) {
            $phone = (string) $request->input('phone', '');
            $key = sha1(($request->ip() ?? 'no-ip') . '|' . $phone);
            $maxRequests = (int) config('user.otp.rate_limit.max_requests', 3);
            $decayMinutes = (int) config('user.otp.rate_limit.decay_minutes', 10);

            return Limit::perMinutes($decayMinutes, $maxRequests)
                ->by($key)
                ->response(function () {
                    return response()->json([
                        'error_code' => 'AUTH.OTP_RATE_LIMITED',
                        'message' => 'Çok fazla OTP isteği. Daha sonra tekrar deneyin.',
                        'errors' => [],
                    ], 429);
                });
        });
    }
}
