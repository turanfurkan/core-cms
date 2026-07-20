<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Users;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Support\Facades\DB;

class RestoreUserAction
{
    public function execute(User $user): User
    {
        return DB::transaction(function () use ($user) {
            $user->restore();

            $user->status = User::STATUS_ACTIVE;
            $user->save();

            // Log activity
            activity('user.restore')
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->log('user.restored');

            return $user;
        });
    }
}
