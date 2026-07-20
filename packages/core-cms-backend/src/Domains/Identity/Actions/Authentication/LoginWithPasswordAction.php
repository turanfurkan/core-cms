<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication;

use TuranFurkan\CoreCms\Domains\Identity\Events\UserLoggedIn;
use TuranFurkan\CoreCms\Domains\Identity\Events\UserLoginFailed;
use TuranFurkan\CoreCms\Domains\Identity\Exceptions\LoginException;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Support\Facades\RateLimiter;

class LoginWithPasswordAction
{
    public const TYPE_PHONE = 'phone';
    public const TYPE_EMAIL = 'email';

    public function __construct(
        private Hasher $hasher,
        private int $maxAttempts,
        private int $decaySeconds,
    ) {
    }

    public function execute(
        string $login,
        string $loginType,
        string $password,
        ?string $ip = null,
        ?string $userAgent = null,
    ): User {
        $key = $this->throttleKey($ip, $login);

        if (RateLimiter::tooManyAttempts($key, $this->maxAttempts)) {
            throw LoginException::tooManyAttempts(RateLimiter::availableIn($key));
        }

        $user = $this->lookupUser($login, $loginType);

        if ($user === null) {
            RateLimiter::hit($key, $this->decaySeconds);
            UserLoginFailed::dispatch(
                $login,
                UserLoginFailed::REASON_UNKNOWN_USER,
                $ip,
                $userAgent,
                null,
            );
            throw LoginException::invalidCredentials();
        }

        if (! $user->canLoginWithPassword()) {
            UserLoginFailed::dispatch(
                $login,
                UserLoginFailed::REASON_PASSWORD_LOGIN_DISABLED,
                $ip,
                $userAgent,
                $user->id,
            );
            throw LoginException::passwordLoginDisabled();
        }

        if (! $user->isActive()) {
            UserLoginFailed::dispatch(
                $login,
                UserLoginFailed::REASON_ACCOUNT_LOCKED,
                $ip,
                $userAgent,
                $user->id,
            );
            throw LoginException::accountLocked();
        }

        if (! $this->hasher->check($password, (string) $user->password)) {
            RateLimiter::hit($key, $this->decaySeconds);
            UserLoginFailed::dispatch(
                $login,
                UserLoginFailed::REASON_INVALID_PASSWORD,
                $ip,
                $userAgent,
                $user->id,
            );
            throw LoginException::invalidCredentials();
        }

        RateLimiter::clear($key);

        UserLoggedIn::dispatch(
            $user,
            UserLoggedIn::METHOD_PASSWORD,
            $ip,
            $userAgent,
        );

        return $user;
    }

    private function lookupUser(string $login, string $loginType): ?User
    {
        $column = $loginType === self::TYPE_PHONE ? 'phone' : 'email';

        return User::query()->where($column, $login)->first();
    }

    private function throttleKey(?string $ip, string $login): string
    {
        return 'login|' . sha1(($ip ?? 'no-ip') . '|' . mb_strtolower($login));
    }
}
