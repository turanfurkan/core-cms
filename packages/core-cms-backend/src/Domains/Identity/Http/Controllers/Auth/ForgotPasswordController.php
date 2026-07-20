<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\SendPasswordResetLinkAction;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Exception;

class ForgotPasswordController extends Controller
{
    public function __invoke(ForgotPasswordRequest $request, SendPasswordResetLinkAction $action): JsonResponse
    {
        try {
            $message = $action->execute($request->input('email'));

            return response()->json([
                'status' => 'success',
                'message' => $message,
            ]);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('Password Reset Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
