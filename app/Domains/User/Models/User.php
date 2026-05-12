<?php

namespace App\Domains\User\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail, HasMedia
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles, InteractsWithMedia, SoftDeletes;

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')
            ->singleFile();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'status',
    ];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_BLOCKED = 'blocked';
    public const STATUS_SUSPENDED = 'suspended';

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function loginOtps(): HasMany
    {
        return $this->hasMany(LoginOtp::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isBlocked(): bool
    {
        return $this->status === self::STATUS_BLOCKED;
    }

    public function isSuspended(): bool
    {
        return $this->status === self::STATUS_SUSPENDED;
    }

    public function canLoginWithPassword(): bool
    {
        return $this->password !== null && $this->password !== '';
    }

    public function getRoleWeight(): int
    {
        $roleWeights = [
            'super_admin' => 100,
            'admin'       => 50,
            'editor'      => 20,
            'user'        => 1
        ];

        return $this->roles->max(fn($role) => $roleWeights[$role->name] ?? 0) ?? 0;
    }

    public function canRevokeSessionsOf(User $target): bool
    {
        if ($this->id === $target->id) {
            return true;
        }

        return $this->getRoleWeight() > $target->getRoleWeight();
    }

    protected static function newFactory(): Factory
    {
        return UserFactory::new();
    }
}
