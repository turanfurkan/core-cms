<?php

namespace TuranFurkan\CoreCms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Cache;

class NavigationItem extends Model
{
    protected $fillable = [
        'navigation_id',
        'parent_id',
        'title',
        'type',
        'url',
        'linked_resource_type',
        'linked_resource_id',
        'target',
        'order',
        'is_active',
    ];

    protected $casts = [
        'title' => 'array',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saved(function ($item) {
            $item->clearCache();
        });

        static::deleted(function ($item) {
            $item->clearCache();
        });
    }

    public function clearCache(): void
    {
        if ($this->navigation) {
            Cache::forget("navigations.{$this->navigation->key}");
        }
    }

    public function navigation(): BelongsTo
    {
        return $this->belongsTo(Navigation::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')
            ->orderBy('order')
            ->with('children');
    }

    public function linkedResource(): MorphTo
    {
        return $this->morphTo();
    }
}
