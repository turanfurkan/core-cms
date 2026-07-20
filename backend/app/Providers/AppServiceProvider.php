<?php

namespace App\Providers;

use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\LoginWithPasswordAction;
use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\RequestLoginOtpAction;
use TuranFurkan\CoreCms\Domains\Identity\Contracts\SmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Events\OtpDeliveryFailed;
use TuranFurkan\CoreCms\Domains\Identity\Events\OtpRequested;
use TuranFurkan\CoreCms\Domains\Identity\Events\OtpRequestRateLimited;
use TuranFurkan\CoreCms\Domains\Identity\Events\OtpVerificationFailed;
use TuranFurkan\CoreCms\Domains\Identity\Events\OtpVerified;
use TuranFurkan\CoreCms\Domains\Identity\Events\UserLoggedIn;
use TuranFurkan\CoreCms\Domains\Identity\Events\UserLoggedOut;
use TuranFurkan\CoreCms\Domains\Identity\Events\UserLoginFailed;
use TuranFurkan\CoreCms\Domains\Identity\Events\UserRegistered;
use TuranFurkan\CoreCms\Domains\Identity\Listeners\LogFailedLogin;
use TuranFurkan\CoreCms\Domains\Identity\Listeners\LogLogoutActivity;
use TuranFurkan\CoreCms\Domains\Identity\Listeners\LogOtpDeliveryFailed;
use TuranFurkan\CoreCms\Domains\Identity\Listeners\LogOtpRateLimited;
use TuranFurkan\CoreCms\Domains\Identity\Listeners\LogOtpRequested;
use TuranFurkan\CoreCms\Domains\Identity\Listeners\LogOtpVerificationFailed;
use TuranFurkan\CoreCms\Domains\Identity\Listeners\LogOtpVerified;
use TuranFurkan\CoreCms\Domains\Identity\Listeners\LogRegisteredUser;
use TuranFurkan\CoreCms\Domains\Identity\Listeners\LogSuccessfulLogin;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Identity\Policies\UserPolicy;
use TuranFurkan\CoreCms\Domains\Identity\Sms\FakeSmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Sms\LogSmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Sms\NetgsmSmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Sms\TwilioSmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Support\OtpCodeGenerator;
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
            'App\\Domains\\User\\Models\\User' => \TuranFurkan\CoreCms\Domains\Identity\Models\User::class,
            'App\\Domains\\Identity\\Models\\User' => \TuranFurkan\CoreCms\Domains\Identity\Models\User::class,
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
            \TuranFurkan\CoreCms\Domains\Workflow\Events\WorkflowTransitioned::class,
            \TuranFurkan\CoreCms\Domains\Workflow\Listeners\AutoPublishWorkflowListener::class
        );
        Event::listen(
            \TuranFurkan\CoreCms\Domains\Workflow\Events\WorkflowTransitioned::class,
            \TuranFurkan\CoreCms\Domains\Integration\Listeners\WebhookEventListener::class
        );
        Event::listen(
            \TuranFurkan\CoreCms\Domains\Forms\Events\FormSubmitted::class,
            \TuranFurkan\CoreCms\Domains\Forms\Listeners\SendFormSubmissionAlert::class
        );
        Event::listen(
            \TuranFurkan\CoreCms\Domains\Forms\Events\FormSubmitted::class,
            \TuranFurkan\CoreCms\Domains\Integration\Listeners\WebhookEventListener::class
        );
        Event::listen(UserRegistered::class, \TuranFurkan\CoreCms\Domains\Integration\Listeners\WebhookEventListener::class);

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
