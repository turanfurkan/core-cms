<?php

namespace Database\Seeders;

use App\Domains\Content\Models\ContentEntry;
use App\Domains\Media\Models\MediaItem;
use App\Domains\Media\Models\MediaLibraryPlaceholder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class RaceDataImporter extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sqlPath = 'c:\\Users\\furka\\Downloads\\sporfest_db.sql';

        $this->command->info("Parsing SQL dump file: {$sqlPath}");
        $this->loadSqlIntoTempTables($sqlPath);

        $this->command->info("Importing categories...");
        $categoryMap = $this->importCategories();

        $this->command->info("Importing races...");
        $raceMap = $this->importRaces($categoryMap);

        $this->command->info("Linking multi-race child relations...");
        $this->linkMultiRaces($raceMap);

        $this->command->info("Cleaning up temporary tables...");
        $this->cleanupTempTables();

        $this->command->info("Database race and category import completed successfully!");
    }

    /**
     * Parse SQL file and load temp tables.
     */
    private function loadSqlIntoTempTables(string $sqlPath): void
    {
        $handle = fopen($sqlPath, 'r');
        if (!$handle) {
            throw new \RuntimeException("Could not open file: {$sqlPath}");
        }

        // Drop existing temp tables
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

        $this->command->info("Temp tables loaded:");
        $this->command->info("- temp_categories: {$catCount} rows");
        $this->command->info("- temp_races: {$raceCount} rows");
        $this->command->info("- temp_multiple_races: {$multCount} rows");
        $this->command->info("- temp_race_images: {$imgCount} rows");
    }

    /**
     * Download asset file and register in media library.
     */
    private function downloadAndRegisterMedia(?string $relativePath): ?int
    {
        if (empty($relativePath)) {
            return null;
        }

        // Clean relative path prefix if any
        $cleanPath = ltrim($relativePath, '/');
        $url = "https://sporfest.com.tr/" . $cleanPath;

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

    /**
     * Import categories into content_entries (content_type_id = 8).
     */
    private function importCategories(): array
    {
        $categoryMap = [];
        $legacyCategories = DB::table('temp_categories')->get();

        foreach ($legacyCategories as $cat) {
            $this->command->comment("Processing category: {$cat->name} (Legacy ID: {$cat->id})");

            // Handle image if exists
            $imageId = $this->downloadAndRegisterMedia($cat->image);

            $data = [
                'name' => [
                    'tr' => $cat->name,
                    'en' => $cat->name,
                ],
                'slug' => [
                    'tr' => Str::slug($cat->name),
                    'en' => Str::slug($cat->name),
                ],
                'description' => [
                    'tr' => $cat->desc ?: $cat->name,
                    'en' => $cat->desc ?: $cat->name,
                ],
            ];

            // In category fields structure, we might not have an image field, but we can store it in JSON data just in case
            if ($imageId) {
                $data['image'] = $imageId;
            }

            $entry = ContentEntry::create([
                'content_type_id' => 8, // categories
                'data' => $data,
                'status' => 'published',
                'created_by' => 1,
                'updated_by' => 1,
                'published_at' => $cat->created_at ?: now(),
                'created_at' => $cat->created_at ?: now(),
                'updated_at' => $cat->updated_at ?: now(),
            ]);

            $categoryMap[$cat->id] = $entry->id;
        }

        // Define and seed missing/deleted categories referenced in races
        $placeholders = [
            12 => 'LİKYA GRANFONDO 2024',
            13 => 'ÖLÜDENİZ OPEN WATER 2024',
            14 => 'LİKYA YARI MARATONU 2024',
            101 => 'KING OF THE HILL 2026',
            102 => 'YARIM ADA CHALLENGE 2025',
        ];

        foreach ($placeholders as $legacyId => $name) {
            if (!isset($categoryMap[$legacyId])) {
                $this->command->comment("Creating missing placeholder category: {$name} (Legacy ID: {$legacyId})");
                $data = [
                    'name' => [
                        'tr' => $name,
                        'en' => $name,
                    ],
                    'slug' => [
                        'tr' => Str::slug($name),
                        'en' => Str::slug($name),
                    ],
                    'description' => [
                        'tr' => $name,
                        'en' => $name,
                    ],
                ];

                $entry = ContentEntry::create([
                    'content_type_id' => 8,
                    'data' => $data,
                    'status' => 'published',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'published_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $categoryMap[$legacyId] = $entry->id;
            }
        }

        return $categoryMap;
    }

    /**
     * Import races into content_entries (content_type_id = 14).
     */
    private function importRaces(array $categoryMap): array
    {
        $raceMap = [];
        $legacyRaces = DB::table('temp_races')->get();

        foreach ($legacyRaces as $race) {
            $this->command->comment("Processing race: {$race->race_name} (Legacy ID: {$race->id})");

            // Download media items
            $coverImageId = $this->downloadAndRegisterMedia($race->image);
            $graphicImageId = $this->downloadAndRegisterMedia($race->graph_image);
            $gpxFileId = $this->downloadAndRegisterMedia($race->gpx_file);
            $stravaFileId = $this->downloadAndRegisterMedia($race->strava_file);

            // Fetch and download gallery images
            $galleryIds = [];
            $legacyImages = DB::table('temp_race_images')->where('race_id', $race->id)->get();
            foreach ($legacyImages as $img) {
                $galleryImageId = $this->downloadAndRegisterMedia($img->image);
                if ($galleryImageId) {
                    $galleryIds[] = $galleryImageId;
                }
            }

            // Map category_id
            $categoryId = isset($categoryMap[$race->category_id]) ? (string)$categoryMap[$race->category_id] : null;

            // Format start time to HH:MM
            $startTime = '08:00';
            if ($race->race_time) {
                $parts = explode(':', $race->race_time);
                if (count($parts) >= 2) {
                    $startTime = $parts[0] . ':' . $parts[1];
                }
            }

            $data = [
                'is_multi_race' => (bool)$race->is_multiple,
                'child_races' => [], // Linked in next phase
                'is_sales_active' => (bool)$race->registration_opened,
                'is_free' => (bool)$race->is_free,
                'title' => [
                    'tr' => $race->race_name,
                    'en' => $race->race_name,
                ],
                'content' => [
                    'tr' => $race->description ?: '',
                    'en' => $race->description ?: '',
                ],
                'cover_image' => $coverImageId,
                'graphic_image' => $graphicImageId,
                'youtube_embed' => $race->race_video ?: '',
                'whats_included' => [
                    'tr' => '',
                    'en' => '',
                ],
                'gallery' => $galleryIds,
                'gpx_file' => $gpxFileId,
                'strava_file' => $stravaFileId,
                'category_id' => $categoryId,
                'status_select' => $race->status === 'publish' ? 'published' : 'draft',
                'location_embed' => $race->location ?: '',

                'start_date' => $race->race_date,
                'start_time' => $startTime,
                'manager_name' => $race->trainer ?: 'Sorumlu Belirtilmedi',
                'manager_phone' => $race->phone_number ?: '5555555555',
                'registration_deadline' => $race->registration_deadline,
                'max_participants' => (int)$race->max_participants,
                'distance' => (string)$race->distance,
                'start_point' => $race->start_point ?: '',
                'finish_point' => $race->end_point ?: '',
                'elevation' => (string)$race->elevation_gain,
                'descent' => (string)$race->elevation_loss,
                'contest_id' => (int)$race->contest,

                // Keep slug for safety
                'slug' => $race->slug ?: Str::slug($race->race_name),
            ];

            // Legacy table fields that might not exist in target CMS but we keep for safety
            $data['price'] = (float)$race->entry_fee;
            $data['discounted_price'] = (float)$race->discounted_price;

            $entry = ContentEntry::create([
                'content_type_id' => 14, // yarislar
                'data' => $data,
                'status' => $race->status === 'publish' ? 'published' : 'draft',
                'created_by' => 1,
                'updated_by' => 1,
                'published_at' => $race->status === 'publish' ? ($race->created_at ?: now()) : null,
                'created_at' => $race->created_at ?: now(),
                'updated_at' => $race->updated_at ?: now(),
            ]);

            $raceMap[$race->id] = $entry->id;
        }

        return $raceMap;
    }

    /**
     * Resolve child race references and populate child_races fields.
     */
    private function linkMultiRaces(array $raceMap): void
    {
        $legacyMultiRaces = DB::table('temp_multiple_races')->get();

        // Group relations by parent race ID
        $parentChildRelations = [];
        foreach ($legacyMultiRaces as $relation) {
            $parentChildRelations[$relation->parent_race_id][] = $relation->race_id;
        }

        foreach ($parentChildRelations as $legacyParentId => $legacyChildIds) {
            if (!isset($raceMap[$legacyParentId])) {
                continue;
            }

            $newParentId = $raceMap[$legacyParentId];
            $newChildIds = [];

            foreach ($legacyChildIds as $legacyChildId) {
                if (isset($raceMap[$legacyChildId])) {
                    $newChildIds[] = (string)$raceMap[$legacyChildId];
                }
            }

            if (!empty($newChildIds)) {
                $entry = ContentEntry::find($newParentId);
                if ($entry) {
                    $data = $entry->data;
                    $data['child_races'] = $newChildIds;
                    $entry->update(['data' => $data]);

                    $this->command->comment("Linked parent race {$newParentId} with child races: " . implode(', ', $newChildIds));
                }
            }
        }
    }

    /**
     * Drop temp tables.
     */
    private function cleanupTempTables(): void
    {
        DB::statement('DROP TABLE IF EXISTS temp_categories');
        DB::statement('DROP TABLE IF EXISTS temp_races');
        DB::statement('DROP TABLE IF EXISTS temp_multiple_races');
        DB::statement('DROP TABLE IF EXISTS temp_race_images');
    }
}
