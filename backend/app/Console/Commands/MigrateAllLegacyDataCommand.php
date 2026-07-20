<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class MigrateAllLegacyDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-all-legacy-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run all legacy database migrations and seeders in the correct sequential order';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        // Temporarily use local single log channel to prevent remote socket timeouts during bulk migration
        config(['logging.default' => 'single']);

        $this->info("=============================================");
        $this->info("STARTING COMPLETE DATABASE MIGRATION...");
        $this->info("=============================================");

        // Step 1: Roles and Permissions Seeder
        $this->info("\n[1/7] Seeding roles and permissions...");
        $this->call('db:seed', [
            '--class' => 'RolesAndPermissionsSeeder',
            '--force' => true,
        ]);

        // Step 2: Settings and Users Seeder
        $this->info("\n[2/7] Seeding default settings and demo users...");
        $this->call('db:seed', [
            '--force' => true,
        ]);

        // Step 3: Identity Data Migration
        $this->info("\n[3/7] Migrating legacy users (Identity data)...");
        $this->call('app:migrate-identity-data');

        // Step 4: Blog Data Migration
        $this->info("\n[4/7] Migrating legacy blog posts...");
        $this->call('app:migrate-blog-data');

        // Step 5: Race & Billing Data Migration
        $this->info("\n[5/7] Migrating legacy races, categories, and payment transactions...");
        $this->call('app:migrate-race-and-billing-data');

        // Step 6: Namespace Upgrade
        $this->info("\n[6/7] Upgrading polymorphic database namespaces...");
        $this->call('core-cms:upgrade-namespaces');

        // Step 7: Local Layout Configurations Import
        $this->info("\n[7/7] Importing local layout configurations (pages, settings, navigations)...");
        $this->call('app:import-layout-configs');

        $this->info("\n=============================================");
        $this->info("✓ COMPLETE DATABASE MIGRATION SUCCESSFUL!");
        $this->info("=============================================");

        return self::SUCCESS;
    }
}
