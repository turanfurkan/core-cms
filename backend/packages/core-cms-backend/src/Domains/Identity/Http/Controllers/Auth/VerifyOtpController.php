<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\CreateAuthTokenAction;
use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\VerifyLoginOtpAction;
use TuranFurkan\CoreCms\Domains\Identity\Exceptions\OtpException;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth\VerifyOtpRequest;
use TuranFurkan\CoreCms\Domains\Identity\Http\Resources\UserResource;
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
