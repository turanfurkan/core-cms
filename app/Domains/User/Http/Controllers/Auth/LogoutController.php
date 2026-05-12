<?php

namespace App\Domains\User\Http\Controllers\Auth;

use App\Domains\User\Actions\LogoutUserAction;
use App\Domains\User\DataTransferObjects\LogoutData;
use App\Domains\User\Http\Requests\Auth\LogoutRequest;
use App\Domains\User\Http\Resources\LogoutResource;
use App\Http\Controllers\Controller;

class LogoutController extends Controller
{
    public function __invoke(LogoutRequest $request, LogoutUserAction $action): LogoutResource
    {
        $data = LogoutData::fromRequest($request);

        $count = $action->execute($data);

        $message = match ($data->scope) {
            'all_devices' => 'Tüm cihazlardaki oturumlarınız sonlandırıldı.',
            'all_except_current' => 'Diğer cihazlardaki oturumlarınız sonlandırıldı.',
            default => 'Oturumunuz başarıyla kapatıldı.',
        };

        return new LogoutResource([
            'message' => $message,
            'revoked_count' => $count,
            'scope' => $data->scope,
        ]);
    }
}
