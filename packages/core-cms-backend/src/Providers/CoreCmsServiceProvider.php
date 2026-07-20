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
        $this->app->register(\TuranFurkan\CoreCms\Domains\Localization\Providers\LocalizationServiceProvider::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load package migrations
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');

        // Load package routes
        $this->loadRoutesFrom(__DIR__ . '/../../routes/api.php');

        // Load package console commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                \TuranFurkan\CoreCms\Console\Commands\UpgradeNamespacesCommand::class,
            ]);
        }
    }
}
