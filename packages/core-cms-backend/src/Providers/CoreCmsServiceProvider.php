<?php

namespace TuranFurkan\CoreCms\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Contracts\Hashing\Hasher;
use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\LoginWithPasswordAction;
use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\RequestLoginOtpAction;
use TuranFurkan\CoreCms\Domains\Identity\Sms\SmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Sms\FakeSmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Sms\NetgsmSmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Sms\TwilioSmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Sms\LogSmsGateway;
use TuranFurkan\CoreCms\Domains\Identity\Support\OtpCodeGenerator;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Identity\Policies\UserPolicy;

class CoreCmsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->register(\TuranFurkan\CoreCms\Domains\Localization\Providers\LocalizationServiceProvider::class);

        // Register Identity domain bindings
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

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load package migrations
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');

        // Load package routes
        $this->loadRoutesFrom(__DIR__ . '/../../routes/api.php');

        // Load package console commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                \TuranFurkan\CoreCms\Console\Commands\UpgradeNamespacesCommand::class,
            ]);
        }

        // Register User Policy
        Gate::policy(User::class, UserPolicy::class);

        // Register Morph Maps for backwards compatibility
        \Illuminate\Database\Eloquent\Relations\Relation::morphMap([
            'App\\Domains\\User\\Models\\User' => \TuranFurkan\CoreCms\Domains\Identity\Models\User::class,
            'App\\Domains\\Identity\\Models\\User' => \TuranFurkan\CoreCms\Domains\Identity\Models\User::class,
        ]);
    }
}
