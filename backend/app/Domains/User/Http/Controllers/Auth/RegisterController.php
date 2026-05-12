<?php

namespace App\Domains\User\Http\Controllers\Auth;

use App\Domains\User\Actions\RegisterUserAction;
use App\Domains\User\Actions\RequestLoginOtpAction;
use App\Domains\User\Http\Requests\Auth\RegisterRequest;
use App\Domains\User\Http\Resources\UserResource;
use App\Domains\User\Models\LoginOtp;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class RegisterController extends Controller
{
    public function __invoke(
        RegisterRequest $request,
        RegisterUserAction $action,
        RequestLoginOtpAction $sendOtp,
    ): JsonResponse {
        $user = $action->execute(
            data: $request->validated(),
            actor: null,
            assignRole: null,
            channel: RegisterUserAction::CHANNEL_SELF,
        );

        if ((bool) config('user.register.require_otp_verification')) {
            $sendOtp->execute(
                phone: $user->phone,
                ip: $request->ip(),
                userAgent: $request->userAgent(),
                purpose: LoginOtp::PURPOSE_REGISTER_VERIFY,
            );

            return response()->json([
                'message' => 'Registration successful. Please verify the OTP sent to your phone.',
                'next' => 'verify-otp',
                'phone' => $user->phone,
                'user' => new UserResource($user),
            ], 201);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'user' => new UserResource($user),
        ], 201);
    }
}
