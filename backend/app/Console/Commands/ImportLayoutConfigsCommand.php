<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportLayoutConfigsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-layout-configs';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import layout configurations (pages, settings, navigations) from database/data/layout_configs.json';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $jsonPath = database_path('data/layout_configs.json');

        if (!file_exists($jsonPath)) {
            $this->error("Layout configs JSON file not found at: {$jsonPath}");
            return self::FAILURE;
        }

        $this->info("Loading layout configurations from JSON file...");
        $data = json_decode(file_get_contents($jsonPath), true);

        if (!$data) {
            $this->error("Failed to parse JSON file or file is empty.");
            return self::FAILURE;
        }

        $tables = [
            'languages',
            'settings',
            'pages',
            'navigations',
            'navigation_items',
            'global_blocks',
            'seo_metadata',
        ];

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        foreach ($tables as $table) {
            if (!isset($data[$table])) {
                $this->warn("Table '{$table}' data not found in JSON, skipping.");
                continue;
            }

            $rows = $data[$table];
            $this->info("Importing table '{$table}' (" . count($rows) . " rows)...");

            DB::table($table)->truncate();

            if (!empty($rows)) {
                // Fetch valid columns of the target table to auto-heal schema mismatches
                $allowedColumns = \Illuminate\Support\Facades\Schema::getColumnListing($table);
                
                $filteredRows = [];
                foreach ($rows as $row) {
                    $filteredRows[] = array_intersect_key($row, array_flip($allowedColumns));
                }

                DB::table($table)->insert($filteredRows);
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info("✓ Layout configurations imported successfully!");
        return self::SUCCESS;
    }
}
