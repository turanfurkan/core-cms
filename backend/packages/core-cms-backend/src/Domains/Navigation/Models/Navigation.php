<?php

namespace TuranFurkan\CoreCms\Domains\Navigation\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Navigation extends Model
{
    protected $fillable = [
        'name',
        'key',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saved(function ($navigation) {
            Cache::forget("navigations.{$navigation->key}");
        });

        static::deleted(function ($navigation) {
            Cache::forget("navigations.{$navigation->key}");
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(NavigationItem::class);
    }

    public function rootItems(): HasMany
    {
        return $this->hasMany(NavigationItem::class)
            ->whereNull('parent_id')
            ->orderBy('order');
    }
}
