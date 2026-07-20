<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Actions\Authentication;

use TuranFurkan\CoreCms\Domains\Identity\Events\UserRegistered;
use TuranFurkan\CoreCms\Domains\Identity\Exceptions\RegistrationException;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Identity\Support\PhoneNumberNormalizer;
use TuranFurkan\CoreCms\Domains\Identity\Support\RoleHierarchy;
use Illuminate\Support\Facades\DB;

class RegisterUserAction
{
    public const CHANNEL_SELF = 'self';
    public const CHANNEL_ADMIN = 'admin';

    public function __construct(
        private PhoneNumberNormalizer $phoneNormalizer,
        private RoleHierarchy $roleHierarchy,
    ) {
    }

    /**
     * @param  array{name: string, phone?: ?string, email?: ?string, password?: ?string}  $data
     */
    public function execute(
        array $data,
        ?User $actor = null,
        ?string $assignRole = null,
        string $channel = self::CHANNEL_SELF,
    ): User {
        $this->guard($channel, $actor, $assignRole);

        $phone = null;
        if (!empty($data['phone'])) {
            $phone = $this->phoneNormalizer->normalize((string) $data['phone']);
            if ($phone === null) {
                throw RegistrationException::phoneAlreadyUsed();
            }
        }

        $roleToAssign = $channel === self::CHANNEL_ADMIN
            ? (string) $assignRole
            : (string) config('user.register.default_role', 'user');

        return DB::transaction(function () use ($data, $phone, $roleToAssign, $actor, $channel) {
            $user = User::create([
                'name' => $data['name'],
                'phone' => $phone,
                'email' => $data['email'] ?? null,
                'password' => $data['password'] ?? null,
            ]);

            $user->assignRole($roleToAssign);

            UserRegistered::dispatch($user, $actor?->id, $channel);

            return $user;
        });
    }

    private function guard(string $channel, ?User $actor, ?string $assignRole): void
    {
        if ($channel === self::CHANNEL_ADMIN) {
            if ($actor === null) {
                throw RegistrationException::roleAssignmentForbidden((string) $assignRole);
            }

            if ($assignRole === null || $assignRole === '') {
                throw RegistrationException::invalidRole('');
            }

            if ($this->roleHierarchy->levelOf($assignRole) === 0) {
                throw RegistrationException::invalidRole($assignRole);
            }

            if (! $this->roleHierarchy->canAssign($actor, $assignRole)) {
                throw RegistrationException::roleAssignmentForbidden($assignRole);
            }
        }
    }
}
