<?php

namespace App\Domains\Identity\Actions\Profile;

use App\Domains\Identity\Models\User;
use Illuminate\Http\UploadedFile;

class UpdateAvatarAction
{
    /**
     * Updates the user's avatar using Spatie Media Library.
     *
     * @param User $user
     * @param UploadedFile $file
     * @return string The full URL of the uploaded avatar.
     */
    public function execute(User $user, UploadedFile $file): string
    {
        $media = $user->addMedia($file)
            ->toMediaCollection('avatar');

        return $media->getFullUrl();
    }
}
