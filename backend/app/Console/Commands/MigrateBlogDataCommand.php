<?php

namespace App\Console\Commands;

use TuranFurkan\CoreCms\Domains\Post\Models\Post;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaLibraryPlaceholder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class MigrateBlogDataCommand extends Command
{
    protected $signature = 'app:migrate-blog-data {--skip-media : Skip downloading blog images}';
    protected $description = 'Migrate legacy posts and images directly from mysql_old connection to the new structured posts table';

    public function handle(): int
    {
        $skipMedia = $this->option('skip-media');

        // Verify connection
        try {
            DB::connection('mysql_old')->getPdo();
        } catch (\Exception $e) {
            $this->error("Failed to connect to legacy database: " . $e->getMessage());
            return self::FAILURE;
        }

        $this->info("Truncating current posts table...");
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Post::truncate();
        DB::table('categorizables')->where('categorizable_type', Post::class)->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info("Migrating articles to structured posts directly from database...");
        $legacyPosts = DB::connection('mysql_old')->table('posts')->get();
        $migratedCount = 0;

        foreach ($legacyPosts as $row) {
            $this->comment("Migrating: {$row->title} (Legacy ID: {$row->id})");

            // Resolve and download cover image
            $coverImageId = $skipMedia ? null : $this->downloadAndRegisterMedia($row->image);

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
        $existing = \TuranFurkan\CoreCms\Domains\Media\Models\MediaItem::where('file_name', $fileName)->first();
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
