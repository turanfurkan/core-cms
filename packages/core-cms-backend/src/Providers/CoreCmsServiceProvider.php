<?php

namespace TuranFurkan\CoreCms\Providers;

use Illuminate\Support\ServiceProvider;

class CoreCmsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load package migrations
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
    }
}
