<?php

namespace App\Domains\User\Http\Controllers\Admin;

use App\Domains\User\Actions\ImpersonateUserAction;
use App\Domains\User\Actions\RegisterUserAction;
use App\Domains\User\Actions\SyncUserRolesAction;
use App\Domains\User\Actions\UpdateUserStatusAction;
use App\Domains\User\Http\Requests\Admin\AdminRegisterRequest;
use App\Domains\User\Http\Requests\Admin\SyncUserRolesRequest;
use App\Domains\User\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Domains\User\Http\Resources\UserResource;
use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function updateStatus(User $user, UpdateUserStatusRequest $request, UpdateUserStatusAction $action): UserResource
    {
        $user = $action->execute($user, $request->input('status'));

        return new UserResource($user);
    }

    public function syncRoles(User $user, SyncUserRolesRequest $request, SyncUserRolesAction $action): UserResource
    {
        $user = $action->execute($user, $request->input('roles'));

        return new UserResource($user);
    }

    public function impersonate(User $user, Request $request, ImpersonateUserAction $action): JsonResponse
    {
        $token = $action->execute($request->user(), $user);

        return response()->json([
            'message' => "Şu an {$user->name} kılığındasınız.",
            'access_token' => $token,
            'token_type' => 'Bearer'
        ]);
    }
}
