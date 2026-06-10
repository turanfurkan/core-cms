<?php

namespace App\Domains\Identity\Actions\Users;

use App\Domains\Identity\Models\User;
use Illuminate\Support\Facades\DB;

class DeleteUserAction
{
    public function execute(User $user): void
    {
        DB::transaction(function () use ($user) {
            // Revoke all tokens
            $user->tokens()->delete();

            // Set status to suspended upon trashing
            $user->status = User::STATUS_SUSPENDED;
            $user->save();

            // Perform soft delete
            $user->delete();

            // Log activity
            activity('user.delete')
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->log('user.deleted');
        });
    }
}
