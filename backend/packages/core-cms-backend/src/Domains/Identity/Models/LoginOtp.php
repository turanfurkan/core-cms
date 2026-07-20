<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Models;

use Database\Factories\LoginOtpFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginOtp extends Model
{
    use HasFactory;

    public const PURPOSE_LOGIN = 'login';
    public const PURPOSE_REGISTER_VERIFY = 'register_verify';
    public const PURPOSE_PASSWORD_RESET = 'password_reset';

    public const DELIVERY_QUEUED = 'queued';
    public const DELIVERY_SENT = 'sent';
    public const DELIVERY_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'phone',
        'purpose',
        'code_hash',
        'attempts',
        'max_attempts',
        'delivery_status',
        'ip_address',
        'user_agent',
        'request_id',
        'expires_at',
        'consumed_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function newFactory(): Factory
    {
        return LoginOtpFactory::new();
    }
}
