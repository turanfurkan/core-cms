<?php

namespace App\Domains\Identity\Http\Controllers\Admin;

use App\Domains\Identity\Actions\Users\ImpersonateUserAction;
use App\Domains\Identity\Actions\Authentication\RegisterUserAction;
use App\Domains\Identity\Actions\Users\SyncUserRolesAction;
use App\Domains\Identity\Actions\Users\UpdateUserStatusAction;
use App\Domains\Identity\Actions\Users\ListUsersAction;
use App\Domains\Identity\Actions\Users\UpdateUserAction;
use App\Domains\Identity\Actions\Users\DeleteUserAction;
use App\Domains\Identity\Actions\Users\RestoreUserAction;
use App\Domains\Identity\Http\Requests\Admin\AdminRegisterRequest;
use App\Domains\Identity\Http\Requests\Admin\SyncUserRolesRequest;
use App\Domains\Identity\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Domains\Identity\Http\Requests\Admin\ListUsersRequest;
use App\Domains\Identity\Http\Requests\Admin\UpdateUserRequest;
use App\Domains\Identity\Http\Resources\UserResource;
use App\Domains\Identity\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function index(ListUsersRequest $request, ListUsersAction $action): AnonymousResourceCollection
    {
        $users = $action->execute($request->validated());

        return UserResource::collection($users);
    }

    public function show(User $user): UserResource
    {
        Gate::authorize('view', $user);

        return new UserResource($user);
    }

    public function store(AdminRegisterRequest $request, RegisterUserAction $action): JsonResponse
    {
        $validated = $request->validated();

        $user = $action->execute(
            data: [
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'password' => $validated['password'] ?? null,
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

    public function update(User $user, UpdateUserRequest $request, UpdateUserAction $action): JsonResponse
    {
        $updatedUser = $action->execute($user, $request->validated());

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => new UserResource($updatedUser),
        ], 200);
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

    public function destroy(User $user, DeleteUserAction $action): JsonResponse
    {
        Gate::authorize('delete', $user);

        $action->execute($user);

        return response()->json([
            'message' => 'User deleted successfully.',
        ], 200);
    }

    public function restore(int $userId, RestoreUserAction $action): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($userId);

        Gate::authorize('restore', $user);

        $restoredUser = $action->execute($user);

        return response()->json([
            'message' => 'User restored successfully.',
            'user' => new UserResource($restoredUser),
        ], 200);
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
