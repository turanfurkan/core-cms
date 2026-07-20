<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Support;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;

class RoleHierarchy
{
    /**
     * Return the highest hierarchy level the actor currently has.
     * Returns 0 when the actor has no recognised role.
     */
    public function level(User $user): int
    {
        $hierarchy = $this->hierarchy();
        $max = 0;

        foreach ($user->getRoleNames() as $roleName) {
            $level = $hierarchy[$roleName] ?? 0;
            if ($level > $max) {
                $max = $level;
            }
        }

        return $max;
    }

    public function levelOf(string $roleName): int
    {
        return $this->hierarchy()[$roleName] ?? 0;
    }

    /**
     * Determine whether $actor is allowed to assign $targetRole.
     * Rule: actor must have a strictly higher level than the target role.
     */
    public function canAssign(User $actor, string $targetRole): bool
    {
        $targetLevel = $this->levelOf($targetRole);

        if ($targetLevel === 0) {
            return false;
        }

        $actorLevel = $this->level($actor);

        if ($actorLevel <= $targetLevel) {
            return false;
        }

        if ($this->isCritical($targetRole) && ! $actor->can('role.assign.admin')) {
            return false;
        }

        return true;
    }

    public function isCritical(string $roleName): bool
    {
        return in_array($roleName, $this->criticalRoles(), true);
    }

    /**
     * @return array<string, int>
     */
    private function hierarchy(): array
    {
        return (array) config('user.roles.hierarchy', []);
    }

    /**
     * @return array<int, string>
     */
    private function criticalRoles(): array
    {
        return (array) config('user.roles.critical', []);
    }
}
