<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Users;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Support\Facades\DB;

class UpdateUserAction
{
    public function execute(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $fillData = [
                'name' => $data['name'] ?? $user->name,
                'email' => $data['email'] ?? $user->email,
                'phone' => $data['phone'] ?? $user->phone,
                'status' => $data['status'] ?? $user->status,
            ];

            if (!empty($data['password'])) {
                $fillData['password'] = bcrypt($data['password']);
            }

            $user->fill($fillData);
            $user->save();

            // Sync Role if provided
            if (isset($data['role'])) {
                $user->syncRoles([$data['role']]);
            }

            // Log update activity
            activity('user.update')
                ->causedBy(auth()->user())
                ->performedOn($user)
                ->withProperties([
                    'updated_fields' => array_keys($data),
                ])
                ->log('user.profile.updated');

            return $user;
        });
    }
}
