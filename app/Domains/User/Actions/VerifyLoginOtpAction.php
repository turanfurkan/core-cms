<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Events\OtpVerificationFailed;
use App\Domains\User\Events\OtpVerified;
use App\Domains\User\Exceptions\OtpException;
use App\Domains\User\Models\LoginOtp;
use App\Domains\User\Models\User;
use App\Domains\User\Support\AuditMasker;
use App\Domains\User\Support\PhoneNumberNormalizer;
use Illuminate\Support\Facades\Hash;

class VerifyLoginOtpAction
{
    public function __construct(private PhoneNumberNormalizer $phoneNormalizer)
    {
    }

    public function execute(
        string $phone,
        string $code,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
        string $purpose = LoginOtp::PURPOSE_LOGIN
    ): User {
        $normalizedPhone = $this->phoneNormalizer->normalize($phone);
        $maskedPhone = AuditMasker::maskPhone($normalizedPhone ?? $phone);

        if ($normalizedPhone === null) {
            OtpVerificationFailed::dispatch($maskedPhone, 'invalid_phone', $ip, $userAgent, $requestId);
            throw OtpException::notFound();
        }

        $query = LoginOtp::query()
            ->where('phone', $normalizedPhone)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at');

        if ($requestId) {
            $query->where('request_id', $requestId);
        }

        /** @var LoginOtp|null $otp */
        $otp = $query->latest('id')->first();

        if (! $otp) {
            OtpVerificationFailed::dispatch($maskedPhone, 'not_found', $ip, $userAgent, $requestId);
            throw OtpException::notFound();
        }

        if ($otp->expires_at->isPast()) {
            OtpVerificationFailed::dispatch($maskedPhone, 'expired', $ip, $userAgent, $requestId);
            throw OtpException::expired();
        }

        if ($otp->attempts >= $otp->max_attempts) {
            OtpVerificationFailed::dispatch($maskedPhone, 'max_attempts', $ip, $userAgent, $requestId);
            throw OtpException::maxAttemptsReached();
        }

        $otp->attempts++;

        if (! Hash::check($code, $otp->code_hash)) {
            if ($otp->attempts >= $otp->max_attempts) {
                $otp->consumed_at = now();
            }

            $otp->save();

            if ($otp->consumed_at) {
                OtpVerificationFailed::dispatch($maskedPhone, 'max_attempts', $ip, $userAgent, $requestId);
                throw OtpException::maxAttemptsReached();
            }

            OtpVerificationFailed::dispatch($maskedPhone, 'invalid_code', $ip, $userAgent, $requestId);
            throw OtpException::invalid();
        }

        $otp->consumed_at = now();
        $otp->save();

        $user = $otp->user;

        if (! $user) {
            OtpVerificationFailed::dispatch($maskedPhone, 'user_not_found', $ip, $userAgent, $requestId);
            throw OtpException::notFound();
        }

        if (! $user->phone_verified_at) {
            $user->forceFill(['phone_verified_at' => now()])->save();
        }

        OtpVerified::dispatch($maskedPhone, $user->id, $ip, $userAgent, $requestId);

        return $user;
    }
}
