<?php

namespace App\Domains\Settings\Support;

use App\Domains\Settings\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingHelper
{
    protected const CACHE_KEY = 'settings.all';

    public static function all(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            return Setting::all()->pluck('value', 'key')->toArray();
        });
    }

    public static function get(string $key, mixed $default = null, ?string $locale = null): mixed
    {
        $settings = self::all();
        
        if (!array_key_exists($key, $settings)) {
            return $default;
        }

        $value = $settings[$key];

        if (is_array($value) && $locale) {
            return $value[$locale] ?? $value[config('app.fallback_locale')] ?? reset($value) ?? $default;
        }

        return $value ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );

        self::clearCache();
    }

    public static function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
