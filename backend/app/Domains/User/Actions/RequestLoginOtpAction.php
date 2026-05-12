<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Contracts\SmsGateway;
use App\Domains\User\DataTransferObjects\SendOtpResult;
use App\Domains\User\Events\OtpDeliveryFailed;
use App\Domains\User\Events\OtpRequested;
use App\Domains\User\Events\OtpRequestRateLimited;
use App\Domains\User\Exceptions\OtpException;
use App\Domains\User\Exceptions\SmsDeliveryException;
use App\Domains\User\Models\LoginOtp;
use App\Domains\User\Models\User;
use App\Domains\User\Support\AuditMasker;
use App\Domains\User\Support\OtpCodeGenerator;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class RequestLoginOtpAction
{
    public function __construct(
        private SmsGateway $smsGateway,
        private OtpCodeGenerator $codeGenerator,
        private Hasher $hasher,
        private int $maxAttempts,
        private int $ttlMinutes,
        private int $cooldownSeconds,
        private int $rateLimitMax,
        private int $rateLimitDecaySeconds,
        private string $messageTemplate,
    ) {
    }

    public function execute(
        string $phone,
        ?string $ip = null,
        ?string $userAgent = null,
        string $purpose = LoginOtp::PURPOSE_LOGIN,
    ): SendOtpResult {
        $key = $this->throttleKey($ip, $phone);

        if (RateLimiter::tooManyAttempts($key, $this->rateLimitMax)) {
            $retryAfter = RateLimiter::availableIn($key);
            OtpRequestRateLimited::dispatch(
                AuditMasker::maskPhone($phone),
                $ip,
                $retryAfter,
                OtpRequestRateLimited::REASON_RATE_LIMIT,
            );
            throw OtpException::rateLimited($retryAfter);
        }

        $cooldownRemaining = $this->cooldownRemaining($phone, $purpose);
        if ($cooldownRemaining > 0) {
            OtpRequestRateLimited::dispatch(
                AuditMasker::maskPhone($phone),
                $ip,
                $cooldownRemaining,
                OtpRequestRateLimited::REASON_COOLDOWN,
            );
            throw OtpException::cooldownActive($cooldownRemaining);
        }

        $user = User::query()->where('phone', $phone)->first();
        $code = $this->codeGenerator->generate();
        $requestId = (string) Str::uuid();

        $otp = DB::transaction(function () use ($phone, $purpose, $code, $requestId, $ip, $userAgent, $user): LoginOtp {
            LoginOtp::query()
                ->where('phone', $phone)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            return LoginOtp::create([
                'user_id' => $user?->id,
                'phone' => $phone,
                'purpose' => $purpose,
                'code_hash' => $this->hasher->make($code),
                'attempts' => 0,
                'max_attempts' => $this->maxAttempts,
                'delivery_status' => LoginOtp::DELIVERY_QUEUED,
                'ip_address' => $ip,
                'user_agent' => $userAgent !== null ? mb_substr($userAgent, 0, 191) : null,
                'request_id' => $requestId,
                'expires_at' => now()->addMinutes($this->ttlMinutes),
            ]);
        });

        try {
            $message = strtr($this->messageTemplate, [
                ':code' => $code,
                ':ttl_minutes' => (string) $this->ttlMinutes,
            ]);
            $this->smsGateway->send($phone, $message);
        } catch (SmsDeliveryException $e) {
            $otp->forceFill(['delivery_status' => LoginOtp::DELIVERY_FAILED])->save();

            OtpDeliveryFailed::dispatch(
                AuditMasker::maskPhone($phone),
                $e->provider,
                $e->errorCode,
                $requestId,
            );

            throw OtpException::deliveryFailed();
        }

        $otp->forceFill(['delivery_status' => LoginOtp::DELIVERY_SENT])->save();

        RateLimiter::hit($key, $this->rateLimitDecaySeconds);

        OtpRequested::dispatch(
            AuditMasker::maskPhone($phone),
            'sms',
            $ip,
            $userAgent,
            $requestId,
            OtpRequested::STATUS_SENT,
            $user?->id,
            $purpose,
        );

        return new SendOtpResult(
            retryAfter: $this->cooldownSeconds,
            requestId: $requestId,
        );
    }

    private function throttleKey(?string $ip, string $phone): string
    {
        return 'otp-send|' . sha1(($ip ?? 'no-ip') . '|' . $phone);
    }

    private function cooldownRemaining(string $phone, string $purpose): int
    {
        $last = LoginOtp::query()
            ->where('phone', $phone)
            ->where('purpose', $purpose)
            ->latest('id')
            ->first();

        if ($last === null) {
            return 0;
        }

        $elapsed = now()->diffInSeconds($last->created_at, true);
        $remaining = $this->cooldownSeconds - (int) $elapsed;

        return max(0, $remaining);
    }
}
