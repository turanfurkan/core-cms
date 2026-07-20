<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\ResetPasswordAction;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Exception;

class ResetPasswordController extends Controller
{
    public function __invoke(ResetPasswordRequest $request, ResetPasswordAction $action): JsonResponse
    {
        try {
            $message = $action->execute($request->validated());

            return response()->json([
                'status' => 'success',
                'message' => $message,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
