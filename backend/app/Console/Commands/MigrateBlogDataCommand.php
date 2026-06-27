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

        try {
            $placeholder = MediaLibraryPlaceholder::firstOrCreate([
                'name' => 'global_library',
            ]);

            $media = $placeholder->addMediaFromUrl($url)
                ->toMediaCollection('default');

            return $media->id;
        } catch (\Exception $e) {
            $this->warn("Failed to download cover image from {$url}: " . $e->getMessage());
            return null;
        }
    }
}
