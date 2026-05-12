<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Models\User;
use Illuminate\Http\UploadedFile;

class UploadUserDocumentAction
{
    /**
     * Uploads a compliance document for the user.
     *
     * @param User $user
     * @param UploadedFile $file
     * @param string $type
     * @return string Full URL of the uploaded document.
     */
    public function execute(User $user, UploadedFile $file, string $type): string
    {
        $media = $user->addMedia($file)
            ->withCustomProperties(['document_type' => $type])
            ->toMediaCollection('documents');

        return $media->getFullUrl();
    }
}
