<?php

namespace App\Domains\User\Actions;

use App\Domains\User\Models\ConsentLog;
use App\Domains\User\Models\User;

class StoreUserConsentAction
{
    /**
     * Stores a user consent log with IP and User-Agent.
     *
     * @param User $user
     * @param array $data
     * @return ConsentLog
     */
    public function execute(User $user, array $data): ConsentLog
    {
        return ConsentLog::create([
            'user_id' => $user->id,
            'consent_type' => $data['consent_type'],
            'version' => $data['version'],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
