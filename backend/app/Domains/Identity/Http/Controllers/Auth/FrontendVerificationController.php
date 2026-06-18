<?php

namespace App\Domains\Identity\Http\Controllers\Auth;

use App\Domains\Identity\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class FrontendVerificationController extends Controller
{
    public function generateResetToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'status' => 'success',
                'message' => 'If an account with that email exists, a password reset link has been sent.',
            ]);
        }

        $token = Str::random(64);

        DB::table('verification_tokens')->insert([
            'identifier' => (string) $user->id,
            'token' => $token,
            'expires' => Carbon::now()->addHour(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Token generated successfully.',
            'token' => $token,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function verifyResetToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        $tokenRecord = DB::table('verification_tokens')
            ->where('token', $validated['token'])
            ->first();

        if (!$tokenRecord || Carbon::parse($tokenRecord->expires)->isPast()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired token.',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Token is valid.',
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:8'],
        ]);

        $tokenRecord = DB::table('verification_tokens')
            ->where('token', $validated['token'])
            ->first();

        if (!$tokenRecord || Carbon::parse($tokenRecord->expires)->isPast()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired token.',
            ], 400);
        }

        $user = User::find($tokenRecord->identifier);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found.',
            ], 404);
        }

        DB::transaction(function () use ($user, $validated, $tokenRecord) {
            $user->update([
                'password' => Hash::make($validated['newPassword']),
            ]);

            DB::table('verification_tokens')
                ->where('token', $tokenRecord->token)
                ->delete();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Password reset successful.',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        $tokenRecord = DB::table('verification_tokens')
            ->where('token', $validated['token'])
            ->first();

        if (!$tokenRecord || Carbon::parse($tokenRecord->expires)->isPast()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired token.',
            ], 400);
        }

        $user = User::find($tokenRecord->identifier);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found.',
            ], 404);
        }

        DB::transaction(function () use ($user, $tokenRecord) {
            $user->update([
                'status' => 'active',
                'email_verified_at' => Carbon::now(),
            ]);

            DB::table('verification_tokens')
                ->where('token', $tokenRecord->token)
                ->delete();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Email verified successfully!',
        ]);
    }
}
