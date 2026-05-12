<?php

namespace App\Domains\User\Http\Controllers\Admin;

use App\Domains\User\Actions\RegisterUserAction;
use App\Domains\User\Http\Requests\Admin\AdminRegisterRequest;
use App\Domains\User\Http\Resources\UserResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function store(AdminRegisterRequest $request, RegisterUserAction $action): JsonResponse
    {
        $validated = $request->validated();

        $user = $action->execute(
            data: [
                'name' => $validated['name'],
                'phone' => $validated['phone'],
                'email' => $validated['email'] ?? null,
                'password' => $validated['password'],
            ],
            actor: $request->user(),
            assignRole: $validated['role'],
            channel: RegisterUserAction::CHANNEL_ADMIN,
        );

        return response()->json([
            'message' => 'User created successfully.',
            'user' => new UserResource($user),
        ], 201);
    }
}
