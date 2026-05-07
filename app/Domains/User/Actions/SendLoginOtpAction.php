<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Models\LoginOtp;
use App\Domains\User\Models\User;
use App\Domains\User\Support\PhoneNumberNormalizer;
use InvalidArgumentException;
use Illuminate\Support\Facades\Hash;

class SendLoginOtpAction
{
    public function __construct(private PhoneNumberNormalizer $phoneNormalizer)
    {
    }

    public function execute(string $phone, ?User $user = null, int $ttlMinutes = 5): string
    {
        $normalizedPhone = $this->phoneNormalizer->normalize($phone);

        if ($normalizedPhone === null) {
            throw new InvalidArgumentException('Phone number could not be normalized.');
        }

        $otp = (string) random_int(100000, 999999);

        LoginOtp::query()
            ->where('phone', $normalizedPhone)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        LoginOtp::create([
            'user_id' => $user?->id,
            'phone' => $normalizedPhone,
            'code_hash' => Hash::make($otp),
            'expires_at' => now()->addMinutes($ttlMinutes),
        ]);

        return $otp;
    }
}
