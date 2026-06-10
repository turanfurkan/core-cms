<?php

namespace App\Domains\Identity\Actions\Users;

use App\Domains\Identity\Models\User;

class ImpersonateUserAction
{
    /**
     * Generates a new token for the target user to allow admin impersonation.
     *
     * @param User $admin The admin performing the action.
     * @param User $target The user being impersonated.
     * @return string The plain text token.
     */
    public function execute(User $admin, User $target): string
    {
        // P0: Create a token for the target user
        $tokenName = "impersonated_by_{$admin->id}";
        
        return $target->createToken($tokenName)->plainTextToken;
    }
}
