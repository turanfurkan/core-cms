<?php

namespace App\Domains\Localization\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Translation extends Model
{
    protected $fillable = [
        'group',
        'key',
        'text',
    ];

    protected $casts = [
        'text' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saved(function ($translation) {
            $translation->clearCache();
        });

        static::deleted(function ($translation) {
            $translation->clearCache();
        });
    }

    public function clearCache(): void
    {
        $locales = is_array($this->text) ? array_keys($this->text) : [];
        foreach ($locales as $locale) {
            Cache::forget("translations.{$locale}.{$this->group}");
        }
    }
}
