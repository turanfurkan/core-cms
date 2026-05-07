<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Models\LoginOtp;
use App\Domains\User\Models\User;
use App\Domains\User\Support\PhoneNumberNormalizer;
use Illuminate\Support\Facades\Hash;

class VerifyLoginOtpAction
{
    public function __construct(private PhoneNumberNormalizer $phoneNormalizer)
    {
    }

    public function execute(string $phone, string $code): ?User
    {
        $normalizedPhone = $this->phoneNormalizer->normalize($phone);

        if ($normalizedPhone === null) {
            return null;
        }

        $otp = LoginOtp::query()
            ->where('phone', $normalizedPhone)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if (! $otp || $otp->expires_at->isPast()) {
            return null;
        }

        $otp->attempts++;

        if (! Hash::check($code, $otp->code_hash)) {
            if ($otp->attempts >= $otp->max_attempts) {
                $otp->consumed_at = now();
            }

            $otp->save();

            return null;
        }

        $otp->consumed_at = now();
        $otp->save();

        if (! $otp->user) {
            return null;
        }

        if (! $otp->user->phone_verified_at) {
            $otp->user->forceFill(['phone_verified_at' => now()])->save();
        }

        return $otp->user;
    }
}
