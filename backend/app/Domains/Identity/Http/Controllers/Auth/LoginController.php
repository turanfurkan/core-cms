<?php

namespace App\Domains\Identity\Http\Controllers\Auth;

use App\Domains\Identity\Actions\Authentication\CreateAuthTokenAction;
use App\Domains\Identity\Actions\Authentication\LoginWithPasswordAction;
use App\Domains\Identity\Http\Requests\Auth\LoginRequest;
use App\Domains\Identity\Http\Resources\UserResource;
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
