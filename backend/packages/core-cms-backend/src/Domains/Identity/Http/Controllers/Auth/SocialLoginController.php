<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\CreateAuthTokenAction;
use TuranFurkan\CoreCms\Domains\Identity\Http\Resources\UserResource;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SocialLoginController extends Controller
{
    public function __invoke(Request $request, CreateAuthTokenAction $tokenAction): JsonResponse
    {
        $request->validate([
            'provider' => 'required|in:google,facebook',
            'provider_id' => 'required|string',
            'email' => 'required|email',
            'name' => 'required|string',
        ]);

        $provider = $request->input('provider');
        $providerId = $request->input('provider_id');
        $email = $request->input('email');
        $name = $request->input('name');

        // Find or create user
        $user = User::withTrashed()->where(function ($query) use ($provider, $providerId, $email) {
            $query->where($provider . '_id', $providerId)
                  ->orWhere('email', $email);
        })->first();

        if ($user) {
            // Restore if soft deleted
            if ($user->trashed()) {
                $user->restore();
            }

            // Update social ID if not set
            if (!$user->{$provider . '_id'}) {
                $user->update([
                    $provider . '_id' => $providerId,
                ]);
            }
        } else {
            // Create user
            $user = User::forceCreate([
                'name' => $name,
                'email' => $email,
                'password' => '', // Nullable or empty string
                'status' => User::STATUS_ACTIVE,
                $provider . '_id' => $providerId,
            ]);

            // Assign default role 'user'
            $user->assignRole('user');
        }

        // Generate sanctum token
        $token = $tokenAction->execute($user);

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => new UserResource($user),
        ], 200);
    }
}
