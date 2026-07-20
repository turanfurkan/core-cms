<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Policies;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;

class UserPolicy
{
    public function before(User $authUser, string $ability): ?bool
    {
        if ($authUser->hasRole('super_admin')) {
            return true;
        }

        return null;
    }

    public function viewAny(User $authUser): bool
    {
        return $authUser->can('user.viewAny');
    }

    public function view(User $authUser, User $user): bool
    {
        if ($authUser->id === $user->id) {
            return true;
        }

        return $authUser->can('user.view.any');
    }

    public function create(User $authUser): bool
    {
        return $authUser->can('user.create');
    }

    public function update(User $authUser, User $user): bool
    {
        if ($authUser->id === $user->id) {
            return true;
        }

        return $authUser->can('user.update.any');
    }

    public function delete(User $authUser, User $user): bool
    {
        if ($authUser->id === $user->id) {
            return false;
        }

        return $authUser->can('user.delete');
    }

    public function restore(User $authUser, User $user): bool
    {
        return $authUser->can('user.update.any');
    }
}
