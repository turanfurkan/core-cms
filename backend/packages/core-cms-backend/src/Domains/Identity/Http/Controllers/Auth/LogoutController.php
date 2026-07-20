<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication\LogoutUserAction;
use TuranFurkan\CoreCms\Domains\Identity\DTOs\LogoutData;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth\LogoutRequest;
use TuranFurkan\CoreCms\Domains\Identity\Http\Resources\LogoutResource;
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
