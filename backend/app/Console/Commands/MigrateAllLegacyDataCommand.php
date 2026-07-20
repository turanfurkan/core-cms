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
        $this->info("=============================================");
        $this->info("STARTING COMPLETE DATABASE MIGRATION...");
        $this->info("=============================================");

        // Step 1: Roles and Permissions Seeder
        $this->info("\n[1/6] Seeding roles and permissions...");
        $this->call('db:seed', [
            '--class' => 'RolesAndPermissionsSeeder',
            '--force' => true,
        ]);

        // Step 2: Settings and Users Seeder
        $this->info("\n[2/6] Seeding default settings and demo users...");
        $this->call('db:seed', [
            '--force' => true,
        ]);

        // Step 3: Identity Data Migration
        $this->info("\n[3/6] Migrating legacy users (Identity data)...");
        $this->call('app:migrate-identity-data');

        // Step 4: Blog Data Migration
        $this->info("\n[4/6] Migrating legacy blog posts...");
        $this->call('app:migrate-blog-data');

        // Step 5: Race & Billing Data Migration
        $this->info("\n[5/6] Migrating legacy races, categories, and payment transactions...");
        $this->call('app:migrate-race-and-billing-data');

        // Step 6: Namespace Upgrade
        $this->info("\n[6/6] Upgrading polymorphic database namespaces...");
        $this->call('core-cms:upgrade-namespaces');

        $this->info("\n=============================================");
        $this->info("✓ COMPLETE DATABASE MIGRATION SUCCESSFUL!");
        $this->info("=============================================");

        return self::SUCCESS;
    }
}
