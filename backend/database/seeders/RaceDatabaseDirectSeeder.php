<?php

namespace Database\Seeders;

use TuranFurkan\CoreCms\Domains\Category\Models\Category;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaItem;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaLibraryPlaceholder;
use TuranFurkan\CoreCms\Domains\Race\Models\Race;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class RaceDatabaseDirectSeeder extends Seeder
{
    public function run(): void
    {
        $sqlPath = 'c:\\Users\\furka\\Downloads\\sporfest_db.sql';
        $this->command->info("Direct Seeder: Parsing SQL dump file: {$sqlPath}");
        $this->loadSqlIntoTempTables($sqlPath);

        // Truncate tables for a completely clean, direct import
        $this->command->info("Cleaning and truncating new categories and races tables...");
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('categories')->truncate();
        DB::table('races')->truncate();
        DB::table('race_relations')->truncate();
        DB::table('categorizables')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info("Importing Categories directly...");
        $categoryMap = $this->importCategoriesDirectly();

        $this->command->info("Importing Races directly...");
        $this->importRacesDirectly($categoryMap);

        $this->command->info("Establishing child race relations directly...");
        $this->linkMultiRacesDirectly();

        $this->command->info("Cleaning up temporary tables...");
        $this->cleanupTempTables();

        $this->command->info("Direct database import completed successfully!");
    }

    private function loadSqlIntoTempTables(string $sqlPath): void
    {
        $handle = fopen($sqlPath, 'r');
        if (!$handle) {
            throw new \RuntimeException("Could not open file: {$sqlPath}");
        }

        DB::statement('DROP TABLE IF EXISTS temp_categories');
        DB::statement('DROP TABLE IF EXISTS temp_races');
        DB::statement('DROP TABLE IF EXISTS temp_multiple_races');
        DB::statement('DROP TABLE IF EXISTS temp_race_images');

        $inTable = null;
        $buffer = "";

        while (($line = fgets($handle)) !== false) {
            if (strpos($line, "\0") !== false) {
                $line = str_replace("\0", "", $line);
            }
            $trimmed = trim($line);

            if (preg_match('/^CREATE TABLE `(categories|races|multiple_races|race_images)`/i', $trimmed, $matches)) {
                $inTable = $matches[1];
                $buffer = $trimmed;
            } elseif (preg_match('/^INSERT INTO `(categories|races|multiple_races|race_images)`/i', $trimmed, $matches)) {
                $inTable = $matches[1];
                $buffer = $trimmed;
            } elseif ($inTable !== null) {
                $buffer .= " " . $trimmed;
            }

            if ($inTable !== null && substr($trimmed, -1) === ';') {
                $sql = preg_replace('/(CREATE TABLE|INSERT INTO) `(' . $inTable . ')`/i', '$1 `temp_$2`', $buffer);
                try {
                    DB::unprepared($sql);
                } catch (\Exception $e) {
                    $this->command->error("Error running SQL for {$inTable}: " . $e->getMessage());
                }
                $inTable = null;
                $buffer = "";
            }
        }
        fclose($handle);

        $catCount = Schema::hasTable('temp_categories') ? DB::table('temp_categories')->count() : 0;
        $raceCount = Schema::hasTable('temp_races') ? DB::table('temp_races')->count() : 0;
        $multCount = Schema::hasTable('temp_multiple_races') ? DB::table('temp_multiple_races')->count() : 0;
        $imgCount = Schema::hasTable('temp_race_images') ? DB::table('temp_race_images')->count() : 0;

        $this->command->info("Temp tables loaded: temp_categories ({$catCount}), temp_races ({$raceCount}), temp_multiple_races ({$multCount}), temp_race_images ({$imgCount})");
    }

    private function downloadAndRegisterMedia(?string $relativePath): ?int
    {
        if (empty($relativePath)) {
            return null;
        }

        $cleanPath = ltrim($relativePath, '/');
        $url = "https://sporfest.com.tr/" . $cleanPath;
        $fileName = basename($cleanPath);

        // Deduplicate: check if we already have this file in media library
        $existing = MediaItem::where('file_name', $fileName)->first();
        if ($existing) {
            return $existing->id;
        }

        try {
            $placeholder = MediaLibraryPlaceholder::firstOrCreate([
                'name' => 'global_library',
            ]);

            $media = $placeholder->addMediaFromUrl($url)
                ->toMediaCollection('default');

            return $media->id;
        } catch (\Exception $e) {
            $this->command->warn("Failed to download media from {$url}: " . $e->getMessage());
            return null;
        }
    }

    private function importCategoriesDirectly(): array
    {
        $categoryMap = [];
        $legacyCategories = DB::table('temp_categories')->get();

        foreach ($legacyCategories as $cat) {
            $imageId = $this->downloadAndRegisterMedia($cat->image);

            $category = Category::forceCreate([
                'id' => $cat->id,
                'name' => ['tr' => $cat->name, 'en' => $cat->name],
                'slug' => ['tr' => Str::slug($cat->name), 'en' => Str::slug($cat->name)],
                'description' => ['tr' => $cat->desc ?: $cat->name, 'en' => $cat->desc ?: $cat->name],
                'image_id' => $imageId,
                'parent_id' => null,
                'type' => 'race',
                'order' => 0,
                'is_active' => true,
                'created_at' => $cat->created_at ?: now(),
                'updated_at' => $cat->updated_at ?: now(),
            ]);

            $categoryMap[$cat->id] = $category->id;
        }

        // Define and seed missing placeholders referenced in races
        $placeholders = [
            12 => 'LİKYA GRANFONDO 2024',
            13 => 'ÖLÜDENİZ OPEN WATER 2024',
            14 => 'LİKYA YARI MARATONU 2024',
            101 => 'KING OF THE HILL 2026',
            102 => 'YARIM ADA CHALLENGE 2025',
        ];

        foreach ($placeholders as $legacyId => $name) {
            if (!isset($categoryMap[$legacyId])) {
                $category = Category::forceCreate([
                    'id' => $legacyId,
                    'name' => ['tr' => $name, 'en' => $name],
                    'slug' => ['tr' => Str::slug($name), 'en' => Str::slug($name)],
                    'description' => ['tr' => $name, 'en' => $name],
                    'image_id' => null,
                    'parent_id' => null,
                    'type' => 'race',
                    'order' => 0,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $categoryMap[$legacyId] = $category->id;
            }
        }

        return $categoryMap;
    }

    private function importRacesDirectly(array $categoryMap): void
    {
        $legacyRaces = DB::table('temp_races')->get();

        foreach ($legacyRaces as $race) {
            $coverImageId = $this->downloadAndRegisterMedia($race->image);
            $graphicImageId = $this->downloadAndRegisterMedia($race->graph_image);
            $gpxFileId = $this->downloadAndRegisterMedia($race->gpx_file);
            $stravaFileId = $this->downloadAndRegisterMedia($race->strava_file);

            // Import gallery
            $galleryIds = [];
            $legacyImages = DB::table('temp_race_images')->where('race_id', $race->id)->get();
            foreach ($legacyImages as $img) {
                $galleryImageId = $this->downloadAndRegisterMedia($img->image);
                if ($galleryImageId) {
                    $galleryIds[] = $galleryImageId;
                }
            }

            // Start Time normalization
            $startTime = '08:00';
            if ($race->race_time) {
                $parts = explode(':', $race->race_time);
                if (count($parts) >= 2) {
                    $startTime = $parts[0] . ':' . $parts[1];
                }
            }

            // Create Race
            $newRace = Race::forceCreate([
                'id' => $race->id,
                'title' => ['tr' => $race->race_name, 'en' => $race->race_name],
                'slug' => ['tr' => $race->slug ?: Str::slug($race->race_name), 'en' => $race->slug ?: Str::slug($race->race_name)],
                'content' => ['tr' => $race->description ?: '', 'en' => $race->description ?: ''],
                'start_date' => $race->race_date,
                'start_time' => $startTime,
                'location_embed' => $race->location ?: '',
                'price' => (float)$race->entry_fee,
                'discounted_price' => (float)$race->discounted_price,
                'registration_deadline' => $race->registration_deadline,
                'max_participants' => (int)$race->max_participants,
                'distance' => (string)$race->distance,
                'start_point' => $race->start_point ?: '',
                'finish_point' => $race->end_point ?: '',
                'elevation' => (string)$race->elevation_gain,
                'descent' => (string)$race->elevation_loss,
                'cover_image_id' => $coverImageId,
                'graphic_image_id' => $graphicImageId,
                'gpx_file_id' => $gpxFileId,
                'strava_file_id' => $stravaFileId,
                'gallery_ids' => $galleryIds,
                'youtube_embed' => $race->race_video ?: '',
                'is_multi_race' => (bool)$race->is_multiple,
                'manager_name' => $race->trainer ?: 'Sorumlu Belirtilmedi',
                'manager_phone' => $race->phone_number ?: '5555555555',
                'is_sales_active' => (bool)$race->registration_opened,
                'contest_id' => (int)$race->contest,
                'is_free' => (bool)$race->is_free,
                'order' => 0,
                'status' => $race->status === 'publish' ? 'published' : 'draft',
                'created_at' => $race->created_at ?: now(),
                'updated_at' => $race->updated_at ?: now(),
            ]);

            // Sync category polymorphically
            $categoryId = isset($categoryMap[$race->category_id]) ? $categoryMap[$race->category_id] : null;
            if ($categoryId) {
                $newRace->categories()->sync([$categoryId]);
            }
        }
    }

    private function linkMultiRacesDirectly(): void
    {
        $legacyMultiRaces = DB::table('temp_multiple_races')->get();

        foreach ($legacyMultiRaces as $relation) {
            $parent = Race::find($relation->parent_race_id);
            if ($parent) {
                // Eagerly insert relation record if not already existing
                $exists = DB::table('race_relations')
                    ->where('parent_id', $relation->parent_race_id)
                    ->where('child_id', $relation->race_id)
                    ->exists();

                if (!$exists) {
                    $parent->childRaces()->attach($relation->race_id);
                }
            }
        }
    }

    private function cleanupTempTables(): void
    {
        DB::statement('DROP TABLE IF EXISTS temp_categories');
        DB::statement('DROP TABLE IF EXISTS temp_races');
        DB::statement('DROP TABLE IF EXISTS temp_multiple_races');
        DB::statement('DROP TABLE IF EXISTS temp_race_images');
    }
}
