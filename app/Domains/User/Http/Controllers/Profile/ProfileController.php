<?php

namespace App\Domains\User\Http\Controllers\Profile;

use App\Domains\User\Actions\UpdateProfileAction;
use App\Domains\User\DataTransferObjects\UpdateProfileData;
use App\Domains\User\Http\Requests\Profile\UpdateProfileRequest;
use App\Domains\User\Http\Resources\UserResource;
use App\Http\Controllers\Controller;
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
}
