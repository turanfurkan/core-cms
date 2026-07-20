<?php

namespace TuranFurkan\CoreCms\Domains\Integration\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Webhook extends Model
{
    protected $table = 'integrations_webhooks';

    protected $fillable = [
        'name',
        'url',
        'events',
        'secret',
        'headers',
        'is_active',
    ];

    protected $casts = [
        'events' => 'array',
        'headers' => 'array',
        'is_active' => 'boolean',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(WebhookLog::class, 'webhook_id');
    }
}
