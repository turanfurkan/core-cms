<?php

namespace TuranFurkan\CoreCms\Domains\Communication\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class Subscriber extends Model
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'phone',
        'status',
        'unsubscribed_at',
        'ip_address',
        'consent_given',
    ];

    protected $casts = [
        'unsubscribed_at' => 'datetime',
        'consent_given' => 'boolean',
    ];

    public function routeNotificationForSms(): ?string
    {
        return $this->phone;
    }
}
