<?php

namespace TuranFurkan\CoreCms\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class UpgradeNamespacesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'core-cms:upgrade-namespaces';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Upgrade old app/domain polymorphic namespaces in the database to core-cms package namespaces';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info("Upgrading old polymorphic namespaces in database...");

        $replacements = [
            'App\\Domains\\Race\\Models\\Race' => 'TuranFurkan\\CoreCms\\Domains\\Race\\Models\\Race',
            'App\\Domains\\Media\\Models\\MediaLibraryPlaceholder' => 'TuranFurkan\\CoreCms\\Domains\\Media\\Models\\MediaLibraryPlaceholder',
            'App\\Domains\\Identity\\Models\\User' => 'TuranFurkan\\CoreCms\\Domains\\Identity\\Models\\User',
            'App\\Domains\\User\\Models\\User' => 'TuranFurkan\\CoreCms\\Domains\\Identity\\Models\\User',
            'App\\Models\\User' => 'TuranFurkan\\CoreCms\\Domains\\Identity\\Models\\User',
            'App\\Domains\\Category\\Models\\Category' => 'TuranFurkan\\CoreCms\\Domains\\Category\\Models\\Category',
            'App\\Domains\\Post\\Models\\Post' => 'TuranFurkan\\CoreCms\\Domains\\Post\\Models\\Post',
        ];

        $polymorphicColumns = [
            'categorizables' => ['categorizable_type'],
            'media' => ['model_type'],
            'model_has_roles' => ['model_type'],
            'model_has_permissions' => ['model_type'],
            'activity_log' => ['subject_type', 'causer_type'],
        ];

        foreach ($polymorphicColumns as $table => $cols) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($cols as $col) {
                foreach ($replacements as $old => $new) {
                    $affected = DB::table($table)
                        ->where($col, $old)
                        ->update([$col => $new]);

                    if ($affected > 0) {
                        $this->line("Updated $affected rows in $table.$col ($old -> $new)");
                    }
                }
            }
        }

        $this->info("All namespace upgrades completed successfully!");
        return self::SUCCESS;
    }
}
