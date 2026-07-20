<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Profile;

use TuranFurkan\CoreCms\Domains\Identity\DTOs\UpdateProfileData;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;

class UpdateProfileAction
{
    public function execute(User $user, UpdateProfileData $data): User
    {
        $oldEmail = $user->email;
        $oldPhone = $user->phone;

        $user->update($data->toArray());

        // Eğer e-posta değiştiyse doğrulamayı sıfırla
        if ($data->email && $data->email !== $oldEmail) {
            $user->email_verified_at = null;
        }

        // Eğer telefon değiştiyse doğrulamayı sıfırla
        if ($data->phone && $data->phone !== $oldPhone) {
            $user->phone_verified_at = null;
        }

        if ($user->isDirty(['email_verified_at', 'phone_verified_at'])) {
            $user->save();
        }

        return $user;
    }
}
