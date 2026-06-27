<?php

namespace App\Console\Commands;

use App\Domains\Category\Models\Category;
use App\Domains\Content\Models\ContentEntry;
use App\Domains\Race\Models\Race;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateRaceDataCommand extends Command
{
    protected $signature = 'app:migrate-race-data';
    protected $description = 'Migrate legacy category and race entries from dynamic CMS to dedicated tables';

    public function handle(): int
    {
        $this->info('Starting migration of dynamic CMS categories and races...');

        // Truncate tables for clean, idempotent rerun (DDL commits implicitly in MySQL)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('categories')->truncate();
        DB::table('races')->truncate();
        DB::table('race_relations')->truncate();
        DB::table('categorizables')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        DB::transaction(function () {
            // 1. Migrate Categories
            $this->info('Migrating Categories (Content Type 8)...');
            $categoryEntries = ContentEntry::where('content_type_id', 8)->get();
            $categoryCount = 0;

            foreach ($categoryEntries as $entry) {
                $data = $entry->data;
                
                // Format localized strings to structure
                $name = $data['name'] ?? ['tr' => '', 'en' => ''];
                $slug = $data['slug'] ?? ['tr' => '', 'en' => ''];
                $description = $data['description'] ?? ['tr' => '', 'en' => ''];

                // Ensure name and slug are arrays
                if (is_string($name)) {
                    $name = ['tr' => $name, 'en' => $name];
                }
                if (is_string($slug)) {
                    $slug = ['tr' => $slug, 'en' => $slug];
                }
                if (is_string($description)) {
                    $description = ['tr' => $description, 'en' => $description];
                }

                Category::forceCreate([
                    'id' => $entry->id,
                    'name' => $name,
                    'slug' => $slug,
                    'description' => $description,
                    'image_id' => $data['image'] ?? null,
                    'parent_id' => null,
                    'type' => 'race',
                    'order' => 0,
                    'is_active' => true,
                    'created_at' => $entry->created_at ?: now(),
                    'updated_at' => $entry->updated_at ?: now(),
                ]);
                $categoryCount++;
            }
            $this->info("Successfully migrated {$categoryCount} categories.");

            // 2. Migrate Races
            $this->info('Migrating Races (Content Type 14)...');
            $raceEntries = ContentEntry::where('content_type_id', 14)->get();
            $raceCount = 0;
            $relationsToMigrate = [];

            foreach ($raceEntries as $entry) {
                $data = $entry->data;

                $title = $data['title'] ?? ['tr' => '', 'en' => ''];
                $slug = $data['slug'] ?? ['tr' => '', 'en' => ''];
                $content = $data['content'] ?? ['tr' => '', 'en' => ''];

                if (is_string($title)) {
                    $title = ['tr' => $title, 'en' => $title];
                }
                if (is_string($slug)) {
                    $slug = ['tr' => $slug, 'en' => $slug];
                }
                if (is_string($content)) {
                    $content = ['tr' => $content, 'en' => $content];
                }

                $race = Race::forceCreate([
                    'id' => $entry->id,
                    'title' => $title,
                    'slug' => $slug,
                    'content' => $content,
                    'start_date' => $data['start_date'] ?? now()->toDateString(),
                    'start_time' => $data['start_time'] ?? null,
                    'location_embed' => $data['location_embed'] ?? null,
                    'price' => isset($data['price']) ? (float)$data['price'] : 0.00,
                    'discounted_price' => isset($data['discounted_price']) ? (float)$data['discounted_price'] : 0.00,
                    'registration_deadline' => $data['registration_deadline'] ?? now()->toDateString(),
                    'max_participants' => isset($data['max_participants']) ? (int)$data['max_participants'] : 0,
                    
                    'distance' => $data['distance'] ?? null,
                    'start_point' => $data['start_point'] ?? null,
                    'finish_point' => $data['finish_point'] ?? null,
                    'elevation' => $data['elevation'] ?? null,
                    'descent' => $data['descent'] ?? null,
                    
                    'cover_image_id' => $data['cover_image'] ?? null,
                    'graphic_image_id' => $data['graphic_image'] ?? null,
                    'gpx_file_id' => $data['gpx_file'] ?? null,
                    'strava_file_id' => $data['strava_file'] ?? null,
                    'gallery_ids' => $data['gallery'] ?? null,
                    
                    'youtube_embed' => $data['youtube_embed'] ?? null,
                    'is_multi_race' => isset($data['is_multi_race']) ? (bool)$data['is_multi_race'] : false,
                    'manager_name' => $data['manager_name'] ?? null,
                    'manager_phone' => $data['manager_phone'] ?? null,
                    'is_sales_active' => isset($data['is_sales_active']) ? (bool)$data['is_sales_active'] : true,
                    'contest_id' => isset($data['contest_id']) ? (int)$data['contest_id'] : null,
                    'is_free' => isset($data['is_free']) ? (bool)$data['is_free'] : false,
                    'order' => 0,
                    'status' => $entry->status ?: 'published',
                    'created_at' => $entry->created_at ?: now(),
                    'updated_at' => $entry->updated_at ?: now(),
                ]);

                // Sync polymorphic category link
                $categoryId = $data['category_id'] ?? null;
                if ($categoryId) {
                    $race->categories()->sync([$categoryId]);
                }

                // Collect multi-race child relations to link later
                if (!empty($data['child_races'])) {
                    $relationsToMigrate[$entry->id] = $data['child_races'];
                }

                $raceCount++;
            }
            $this->info("Successfully migrated {$raceCount} races.");

            // 3. Migrate Race Relations
            $this->info('Establishing parent-child relationships for multi-races...');
            $relationCount = 0;
            foreach ($relationsToMigrate as $parentId => $childIds) {
                $race = Race::find($parentId);
                if ($race) {
                    // Filter child IDs that actually exist in new races table to avoid foreign key violations
                    $validChildIds = Race::whereIn('id', $childIds)->pluck('id')->toArray();
                    $race->childRaces()->sync($validChildIds);
                    $relationCount += count($validChildIds);
                }
            }
            $this->info("Successfully established {$relationCount} parent-child race mappings.");
        });

        $this->info('Dynamic CMS migration to dedicated tables completed successfully.');
        return self::SUCCESS;
    }
}
