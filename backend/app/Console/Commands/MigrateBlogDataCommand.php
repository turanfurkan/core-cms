<?php

namespace App\Console\Commands;

use App\Domains\Post\Models\Post;
use App\Domains\Media\Models\MediaLibraryPlaceholder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class MigrateBlogDataCommand extends Command
{
    protected $signature = 'app:migrate-blog-data';
    protected $description = 'Migrate legacy posts and images from SQL dump directly to the new structured posts table';

    public function handle(): int
    {
        $sqlPath = 'c:\\Users\\furka\\Downloads\\sporfest_db.sql';

        if (!file_exists($sqlPath)) {
            $this->error("SQL dump file not found at: {$sqlPath}");
            return self::FAILURE;
        }

        $this->info("Truncating current posts table...");
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Post::truncate();
        DB::table('categorizables')->where('categorizable_type', Post::class)->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info("Creating temporary posts table...");
        DB::statement('DROP TABLE IF EXISTS temp_posts');
        DB::statement("CREATE TABLE `temp_posts` (
          `id` bigint(20) UNSIGNED NOT NULL,
          `language` varchar(191) DEFAULT 'tr',
          `title` varchar(191) NOT NULL,
          `content` longtext NOT NULL,
          `slug` varchar(191) NOT NULL,
          `image` varchar(191) NOT NULL,
          `created_at` timestamp NULL DEFAULT NULL,
          `updated_at` timestamp NULL DEFAULT NULL
        )");

        $this->info("Parsing and loading posts data into temp table...");
        $handle = fopen($sqlPath, 'r');
        if (!$handle) {
            $this->error("Could not open SQL file: {$sqlPath}");
            return self::FAILURE;
        }

        $inTable = null;
        $buffer = "";

        while (($line = fgets($handle)) !== false) {
            $line = str_replace("\0", "", $line);
            $trimmed = trim($line);

            if (preg_match('/^INSERT INTO `posts`/i', $trimmed)) {
                $inTable = 'posts';
                $buffer = $trimmed;
            } elseif ($inTable === 'posts') {
                $buffer .= " " . $trimmed;
            }

            if ($inTable === 'posts' && substr($trimmed, -1) === ';') {
                $sql = str_replace("INSERT INTO `posts`", "INSERT INTO `temp_posts`", $buffer);
                try {
                    DB::unprepared($sql);
                } catch (\Exception $e) {
                    $this->error("Error loading temp_posts SQL: " . $e->getMessage());
                }
                $inTable = null;
                $buffer = "";
            }
        }
        fclose($handle);

        $tempCount = DB::table('temp_posts')->count();
        $this->info("Loaded {$tempCount} rows into temp_posts.");

        $this->info("Migrating articles to structured posts...");
        $tempPosts = DB::table('temp_posts')->get();
        $migratedCount = 0;

        foreach ($tempPosts as $row) {
            $this->comment("Migrating: {$row->title} (Legacy ID: {$row->id})");

            // Resolve and download cover image
            $coverImageId = $this->downloadAndRegisterMedia($row->image);

            // Format title, slug, content to localized JSON arrays
            $title = ['tr' => $row->title, 'en' => $row->title];
            $slug = ['tr' => $row->slug, 'en' => $row->slug];
            $content = ['tr' => $row->content, 'en' => $row->content];
            
            // Clean HTML tags for summary excerpt
            $plainText = strip_tags($row->content);
            $excerpt = Str::limit($plainText, 250);
            $summary = ['tr' => $excerpt, 'en' => $excerpt];

            // Estimate reading time: ~200 words per minute
            $wordCount = str_word_count($plainText);
            $readingTime = max(1, (int) ceil($wordCount / 200));

            Post::forceCreate([
                'id' => $row->id,
                'title' => $title,
                'slug' => $slug,
                'content' => $content,
                'summary' => $summary,
                'cover_image_id' => $coverImageId,
                'reading_time' => $readingTime,
                'publish_date' => $row->created_at ?: now(),
                'status' => 'published',
                'created_at' => $row->created_at ?: now(),
                'updated_at' => $row->updated_at ?: now(),
            ]);

            $migratedCount++;
        }

        $this->info("Cleaning up temporary tables...");
        DB::statement('DROP TABLE IF EXISTS temp_posts');

        $this->info("Data migration completed! Successfully imported {$migratedCount} posts.");
        return self::SUCCESS;
    }

    /**
     * Download media from URL and register in media library.
     */
    private function downloadAndRegisterMedia(?string $relativePath): ?int
    {
        if (empty($relativePath)) {
            return null;
        }

        $cleanPath = ltrim($relativePath, '/');
        $url = "https://sporfest.com.tr/" . $cleanPath;
        $fileName = basename($cleanPath);

        // Deduplicate: check if we already have this file in media library
        $existing = \App\Domains\Media\Models\MediaItem::where('file_name', $fileName)->first();
        if ($existing) {
            return $existing->id;
        }

        try {
            $placeholder = MediaLibraryPlaceholder::firstOrCreate([
                'name' => 'global_library',
            ]);

            // Create a temporary file path
            $tempDir = storage_path('app/temp_media');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0777, true);
            }
            $tempFile = $tempDir . '/' . $fileName;

            // Download file using custom curl to bypass SSL issues on local dev
            $ch = curl_init($url);
            $fp = fopen($tempFile, 'wb');
            curl_setopt($ch, CURLOPT_FILE, $fp);
            curl_setopt($ch, CURLOPT_HEADER, 0);
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_exec($ch);
            $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            fclose($fp);

            if ($statusCode !== 200 && $statusCode !== 206) {
                if (file_exists($tempFile)) {
                    unlink($tempFile);
                }
                $this->warn("Failed to download media from {$url} (HTTP Code: {$statusCode})");
                return null;
            }

            if (!file_exists($tempFile) || filesize($tempFile) === 0) {
                if (file_exists($tempFile)) {
                    unlink($tempFile);
                }
                $this->warn("Failed to download media from {$url} (File empty or not found)");
                return null;
            }

            // Register in media library using local path
            $media = $placeholder->addMedia($tempFile)
                ->toMediaCollection('default');

            // Clean up temp file
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }

            return $media->id;
        } catch (\Exception $e) {
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }
            $this->warn("Failed to download media from {$url}: " . $e->getMessage());
            return null;
        }
    }
}
