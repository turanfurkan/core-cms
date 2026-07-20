<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication;

use TuranFurkan\CoreCms\Domains\Identity\DTOs\LogoutData;
use TuranFurkan\CoreCms\Domains\Identity\Events\UserLoggedOut;
use TuranFurkan\CoreCms\Domains\Identity\Exceptions\RevokeFailedException;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Exception;
use Illuminate\Support\Facades\Log;

class LogoutUserAction
{
    public function execute(LogoutData $data): int
    {
        try {
            $currentUser = auth()->user();
            $userId = $data->targetUserId ?? $currentUser?->id;
            $user = User::findOrFail($userId);

            // Hiyerarşi Kontrolü
            if ($currentUser && ! $currentUser->canRevokeSessionsOf($user)) {
                throw RevokeFailedException::forbidden();
            }

            $count = match ($data->scope) {
                'current_only' => $this->revokeCurrent($user, $data->currentAccessTokenId),
                'all_devices' => $this->revokeAll($user),
                'all_except_current' => $this->revokeOthers($user, $data->currentAccessTokenId),
                default => throw new Exception('Geçersiz logout kapsamı.'),
            };

            // Event tetikle
            UserLoggedOut::dispatch(
                $user->id,
                $data->scope,
                request()->ip(),
                request()->userAgent(),
                $data->reason,
                $data->targetUserId ? auth()->id() : null
            );

            return $count;

        } catch (Exception $e) {
            Log::error('Logout hatası: ' . $e->getMessage(), [
                'user_id' => $data->targetUserId,
                'scope' => $data->scope
            ]);

            throw $e;
        }
    }

    private function revokeCurrent(User $user, ?string $tokenId): int
    {
        $token = $user->tokens()->where('id', $tokenId)->first();

        if (!$token) {
            throw RevokeFailedException::sessionNotFound();
        }

        return (int) $token->delete();
    }

    private function revokeAll(User $user): int
    {
        $count = 0;
        $user->tokens->each(function ($token) use (&$count) {
            if ($token->delete()) {
                $count++;
            }
        });

        return $count;
    }

    private function revokeOthers(User $user, ?string $tokenId): int
    {
        $count = 0;
        $user->tokens()->where('id', '!=', $tokenId)->get()->each(function ($token) use (&$count) {
            if ($token->delete()) {
                $count++;
            }
        });

        return $count;
    }
}
