<?php

namespace App\Providers;

use App\Domains\User\Actions\LoginWithPasswordAction;
use App\Domains\User\Events\UserLoggedIn;
use App\Domains\User\Events\UserLoginFailed;
use App\Domains\User\Events\UserRegistered;
use App\Domains\User\Listeners\LogFailedLogin;
use App\Domains\User\Listeners\LogRegisteredUser;
use App\Domains\User\Listeners\LogSuccessfulLogin;
use App\Domains\User\Models\User;
use App\Domains\User\Policies\UserPolicy;
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
    /**
     * Register any application services.
     */
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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);

        Event::listen(UserRegistered::class, LogRegisteredUser::class);
        Event::listen(UserLoggedIn::class, LogSuccessfulLogin::class);
        Event::listen(UserLoginFailed::class, LogFailedLogin::class);

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
    }
}
