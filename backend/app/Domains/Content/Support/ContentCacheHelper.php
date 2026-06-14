<?php

namespace App\Domains\Content\Support;

use Illuminate\Support\Facades\Cache;

class ContentCacheHelper
{
    public static function getVersion(string $contentTypeSlug): int
    {
        return (int) Cache::get("content_type:{$contentTypeSlug}:version", 1);
    }

    public static function invalidate(string $contentTypeSlug): void
    {
        $currentVersion = self::getVersion($contentTypeSlug);
        Cache::put("content_type:{$contentTypeSlug}:version", $currentVersion + 1, now()->addDays(30));
    }

    public static function getCacheKey(string $contentTypeSlug, string $context = '', array $params = []): string
    {
        $version = self::getVersion($contentTypeSlug);
        $paramsHash = count($params) > 0 ? ':' . md5(serialize($params)) : '';
        
        return "content_delivery:{$contentTypeSlug}:v{$version}:{$context}{$paramsHash}";
    }

    public static function remember(
        string $contentTypeSlug,
        string $context,
        array $params,
        \Closure $callback,
        int $seconds = 86400
    ) {
        $key = self::getCacheKey($contentTypeSlug, $context, $params);
        return Cache::remember($key, $seconds, $callback);
    }
}
