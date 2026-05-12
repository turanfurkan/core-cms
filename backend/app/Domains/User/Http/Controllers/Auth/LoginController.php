<?php

namespace App\Domains\User\Http\Controllers\Auth;

use App\Domains\User\Actions\CreateAuthTokenAction;
use App\Domains\User\Actions\LoginWithPasswordAction;
use App\Domains\User\Http\Requests\Auth\LoginRequest;
use App\Domains\User\Http\Resources\UserResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class LoginController extends Controller
{
    public function __invoke(
        LoginRequest $request,
        LoginWithPasswordAction $loginAction,
        CreateAuthTokenAction $tokenAction,
    ): JsonResponse {
        $user = $loginAction->execute(
            login: (string) $request->input('login'),
            loginType: (string) $request->resolvedType(),
            password: (string) $request->input('password'),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        $token = $tokenAction->execute($user);

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => new UserResource($user),
        ], 200);
    }
}
