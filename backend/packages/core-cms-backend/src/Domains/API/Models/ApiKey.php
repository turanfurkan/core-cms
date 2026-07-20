<?php

namespace TuranFurkan\CoreCms\Domains\API\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'hashed_key',
        'hint',
        'scopes',
        'expires_at',
        'is_active',
        'last_used_at',
    ];

    protected $casts = [
        'scopes' => 'array',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    public function hasScope(string $scope): bool
    {
        if (empty($this->scopes)) {
            return false;
        }

        if (in_array('*', $this->scopes)) {
            return true;
        }

        return in_array($scope, $this->scopes);
    }

    public function isExpired(): bool
    {
        if (is_null($this->expires_at)) {
            return false;
        }

        return $this->expires_at->isPast();
    }
}
