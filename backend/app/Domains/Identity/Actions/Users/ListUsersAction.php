<?php

namespace App\Domains\Identity\Actions\Users;

use App\Domains\Identity\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListUsersAction
{
    public function execute(array $filters = []): LengthAwarePaginator
    {
        $query = User::withTrashed()->with('roles');

        // Filter by Status
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        // Filter by Role
        if (!empty($filters['role_id']) && $filters['role_id'] !== 'all') {
            $roleId = $filters['role_id'];
            $query->whereHas('roles', function ($q) use ($roleId) {
                if (is_numeric($roleId)) {
                    $q->where('id', $roleId);
                } else {
                    $q->where('name', $roleId);
                }
            });
        }

        // Search Query
        if (!empty($filters['query'])) {
            $searchTerm = $filters['query'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('email', 'like', "%{$searchTerm}%")
                    ->orWhere('phone', 'like', "%{$searchTerm}%");
            });
        }

        // Sorting
        $sortField = $filters['sort'] ?? 'created_at';
        $sortDir = ($filters['dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        // Map sorting fields to DB columns
        $sortMap = [
            'name' => 'name',
            'email' => 'email',
            'phone' => 'phone',
            'status' => 'status',
            'createdAt' => 'created_at',
            'created_at' => 'created_at',
        ];

        $dbSortField = $sortMap[$sortField] ?? 'created_at';

        if ($sortField === 'role_name') {
            // Join roles table for ordering by role name
            $query->select('users.*')
                ->leftJoin('model_has_roles', function ($join) {
                    $join->on('users.id', '=', 'model_has_roles.model_id')
                        ->where('model_has_roles.model_type', '=', User::class);
                })
                ->leftJoin('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->orderBy('roles.name', $sortDir);
        } else {
            $query->orderBy($dbSortField, $sortDir);
        }

        $limit = $filters['limit'] ?? 10;

        return $query->paginate($limit);
    }
}
