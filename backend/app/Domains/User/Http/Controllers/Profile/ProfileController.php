<?php

namespace App\Domains\User\Http\Controllers\Profile;

use App\Domains\User\Actions\DeleteAccountAction;
use App\Domains\User\Actions\StoreUserConsentAction;
use App\Domains\User\Actions\UpdateAvatarAction;
use App\Domains\User\Actions\UpdatePasswordAction;
use App\Domains\User\Actions\UpdateProfileAction;
use App\Domains\User\Actions\UploadUserDocumentAction;
use App\Domains\User\DataTransferObjects\UpdateProfileData;
use App\Domains\User\Http\Requests\Profile\DeleteAccountRequest;
use App\Domains\User\Http\Requests\Profile\StoreConsentRequest;
use App\Domains\User\Http\Requests\Profile\UpdateAvatarRequest;
use App\Domains\User\Http\Requests\Profile\UpdatePasswordRequest;
use App\Domains\User\Http\Requests\Profile\UpdateProfileRequest;
use App\Domains\User\Http\Requests\Profile\UploadDocumentRequest;
use App\Domains\User\Http\Resources\UserResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Kullanıcının kendi profil bilgilerini döner.
     */
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /**
     * Profil bilgilerini günceller.
     */
    public function update(UpdateProfileRequest $request, UpdateProfileAction $action): UserResource
    {
        $data = UpdateProfileData::fromRequest($request);

        $user = $action->execute($request->user(), $data);

        return new UserResource($user);
    }

    /**
     * Şifre değiştirme işlemini yapar.
     */
    public function changePassword(UpdatePasswordRequest $request, UpdatePasswordAction $action): JsonResponse
    {
        $action->execute(
            $request->user(),
            $request->input('password'),
            $request->boolean('logout_others', true)
        );

        return response()->json([
            'message' => 'Şifreniz başarıyla güncellendi.'
        ]);
    }

    /**
     * Profil fotoğrafını günceller.
     */
    public function updateAvatar(UpdateAvatarRequest $request, UpdateAvatarAction $action): JsonResponse
    {
        $url = $action->execute($request->user(), $request->file('avatar'));

        return response()->json([
            'message' => 'Profil fotoğrafınız güncellendi.',
            'avatar_url' => $url
        ]);
    }

    /**
     * Kullanıcı hesabını siler.
     */
    public function destroy(DeleteAccountRequest $request, DeleteAccountAction $action): JsonResponse
    {
        $action->execute($request->user());

        return response()->json([
            'message' => 'Hesabınız başarıyla silindi.'
        ]);
    }

    /**
     * Kullanıcı sözleşme onaylarını kaydeder.
     */
    public function storeConsent(StoreConsentRequest $request, StoreUserConsentAction $action): JsonResponse
    {
        $action->execute($request->user(), $request->validated());

        return response()->json([
            'message' => 'Onayınız başarıyla kaydedildi.'
        ]);
    }

    /**
     * Kullanıcı dokümanlarını yükler.
     */
    public function uploadDocument(UploadDocumentRequest $request, UploadUserDocumentAction $action): JsonResponse
    {
        $url = $action->execute(
            $request->user(),
            $request->file('document'),
            $request->input('document_type')
        );

        return response()->json([
            'message' => 'Dokümanınız başarıyla yüklendi.',
            'document_url' => $url
        ]);
    }
}
