<?php

namespace App\Domains\Localization\Providers;

use Illuminate\Support\ServiceProvider;
use App\Domains\Localization\Support\DatabaseTranslationLoader;
use App\Domains\Localization\Models\Language;
use Illuminate\Support\Facades\Schema;

class LocalizationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->extend('translation.loader', function ($loader, $app) {
            return new DatabaseTranslationLoader($app['files'], $app['path.lang']);
        });
    }

    public function boot(): void
    {
        \Illuminate\Support\Facades\Log::info("LOCALIZATION SERVICE PROVIDER BOOTED");

        try {
            if (Schema::hasTable('languages')) {
                $defaultLang = Language::where('is_default', true)->first();
                if ($defaultLang) {
                    config(['app.locale' => $defaultLang->code]);
                    app()->setLocale($defaultLang->code);
                }
            }
        } catch (\Throwable $e) {
            // Ignore during setup/migrations
        }
    }
}
