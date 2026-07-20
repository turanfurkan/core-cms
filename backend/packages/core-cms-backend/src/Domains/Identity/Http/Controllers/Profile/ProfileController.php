<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Profile;

use TuranFurkan\CoreCms\Domains\Identity\Actions\Profile\DeleteAccountAction;
use TuranFurkan\CoreCms\Domains\Identity\Actions\Profile\StoreUserConsentAction;
use TuranFurkan\CoreCms\Domains\Identity\Actions\Profile\UpdateAvatarAction;
use TuranFurkan\CoreCms\Domains\Identity\Actions\Profile\UpdatePasswordAction;
use TuranFurkan\CoreCms\Domains\Identity\Actions\Profile\UpdateProfileAction;
use TuranFurkan\CoreCms\Domains\Identity\Actions\Profile\UploadUserDocumentAction;
use TuranFurkan\CoreCms\Domains\Identity\DTOs\UpdateProfileData;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Profile\DeleteAccountRequest;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Profile\StoreConsentRequest;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Profile\UpdateAvatarRequest;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Profile\UpdatePasswordRequest;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Profile\UpdateProfileRequest;
use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Profile\UploadDocumentRequest;
use TuranFurkan\CoreCms\Domains\Identity\Http\Resources\UserResource;
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
