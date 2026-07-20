<?php

namespace TuranFurkan\CoreCms\Domains\Notification\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    protected $fillable = [
        'code',
        'name',
        'channels',
        'subject',
        'content',
        'is_active',
    ];

    protected $casts = [
        'channels' => 'array',
        'content' => 'array',
        'is_active' => 'boolean',
    ];
}
