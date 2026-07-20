<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\RequestLoginOtpAction;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth\SendOtpRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SendOtpController extends Controller
{
    public function __invoke(SendOtpRequest $request, RequestLoginOtpAction $action): JsonResponse
    {
        $result = $action->execute(
            phone: (string) $request->input('phone'),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'OTP gönderildi.',
            'retry_after' => $result->retryAfter,
            'request_id' => $result->requestId,
        ], 200);
    }
}
