<?php

namespace TuranFurkan\CoreCms\Domains\Localization\Support;

use Illuminate\Translation\FileLoader;
use Illuminate\Support\Facades\Cache;
use TuranFurkan\CoreCms\Domains\Localization\Models\Translation;

class DatabaseTranslationLoader extends FileLoader
{
    public function load($locale, $group, $namespace = null)
    {
        // Debug output to check if loader is running
        \Illuminate\Support\Facades\Log::info("DATABASE TRANSLATION LOADER CALLED: locale={$locale}, group={$group}, namespace={$namespace}");

        // Load default file-based translation first
        $fileTranslations = parent::load($locale, $group, $namespace);

        if ($namespace !== null && $namespace !== '*') {
            return $fileTranslations;
        }

        $cacheKey = "translations.{$locale}.{$group}";
        
        $dbTranslations = Cache::rememberForever($cacheKey, function () use ($locale, $group) {
            try {
                if (!\Illuminate\Support\Facades\Schema::hasTable('translations')) {
                    return [];
                }

                return Translation::where('group', $group)
                    ->get()
                    ->mapWithKeys(function ($translation) use ($locale) {
                        return [$translation->key => $translation->text[$locale] ?? null];
                    })
                    ->filter()
                    ->toArray();
            } catch (\Throwable $e) {
                return [];
            }
        });

        return array_merge($fileTranslations, $dbTranslations);
    }
}
