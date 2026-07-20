<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('pages')) {
            Schema::create('pages', function (Blueprint $table) {
                $table->id();
                $table->json('title'); // Localized: {"tr": "...", "en": "..."}
                $table->json('slug');  // Localized: {"tr": "...", "en": "..."}
                $table->json('content')->nullable(); // Localized content builder / blocks
                $table->json('summary')->nullable(); // Localized summary

                $table->string('layout')->default('default'); // default, contact, about, full-width
                $table->string('status')->default('draft'); // draft, published, archived
                $table->boolean('is_system')->default(false); // system pages cannot be deleted

                $table->unsignedBigInteger('parent_id')->nullable();
                $table->integer('order')->default(0);

                $table->unsignedBigInteger('cover_image_id')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();

                $table->softDeletes();
                $table->timestamps();

                // Constraints
                $table->foreign('parent_id')
                    ->references('id')
                    ->on('pages')
                    ->onDelete('set null');

                $table->foreign('cover_image_id')
                    ->references('id')
                    ->on('media')
                    ->onDelete('set null');

                $table->foreign('created_by')
                    ->references('id')
                    ->on('users')
                    ->onDelete('set null');

                $table->foreign('updated_by')
                    ->references('id')
                    ->on('users')
                    ->onDelete('set null');
            });
        } else {
            Schema::table('pages', function (Blueprint $table) {
                if (!Schema::hasColumn('pages', 'summary')) {
                    $table->json('summary')->nullable()->after('content');
                }
                if (!Schema::hasColumn('pages', 'is_system')) {
                    $table->boolean('is_system')->default(false)->after('status');
                }
                if (!Schema::hasColumn('pages', 'parent_id')) {
                    $table->unsignedBigInteger('parent_id')->nullable()->after('is_system');
                }
                if (!Schema::hasColumn('pages', 'order')) {
                    $table->integer('order')->default(0)->after('parent_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't drop pages table if it existed prior to this migration
    }
};
