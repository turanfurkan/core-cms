<?php

namespace App\Domains\User\Http\Controllers;

use App\Domains\User\Actions\CreateAuthTokenAction;
use App\Domains\User\Actions\VerifyLoginOtpAction;
use App\Domains\User\Exceptions\OtpException;
use App\Domains\User\Http\Requests\VerifyOtpRequest;
use App\Domains\User\Http\Resources\UserResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\RateLimiter;

class VerifyOtpController extends Controller
{
    public function __invoke(
        VerifyOtpRequest $request,
        VerifyLoginOtpAction $verifyAction,
        CreateAuthTokenAction $tokenAction,
    ): JsonResponse {
        $phone = (string) $request->input('phone');
        $throttleKey = 'otp-verify|' . sha1($request->ip() . '|' . $phone);

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $retryAfter = RateLimiter::availableIn($throttleKey);
            throw OtpException::verifyRateLimited($retryAfter);
        }

        RateLimiter::hit($throttleKey, 600);

        $user = $verifyAction->execute(
            phone: $phone,
            code: (string) $request->input('code'),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: (string) $request->input('request_id'),
        );

        // Success: Clear rate limit
        RateLimiter::clear($throttleKey);

        $token = $tokenAction->execute($user);

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => new UserResource($user),
        ], 200);
    }
}
