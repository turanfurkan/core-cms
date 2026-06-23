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
        Schema::table('seo_metadata', function (Blueprint $table) {
            if (Schema::hasColumn('seo_metadata', 'title')) {
                $table->renameColumn('title', 'meta_title');
            }
            if (Schema::hasColumn('seo_metadata', 'description')) {
                $table->renameColumn('description', 'meta_description');
            }
            if (Schema::hasColumn('seo_metadata', 'keywords')) {
                $table->renameColumn('keywords', 'meta_keywords');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seo_metadata', function (Blueprint $table) {
            if (Schema::hasColumn('seo_metadata', 'meta_title')) {
                $table->renameColumn('meta_title', 'title');
            }
            if (Schema::hasColumn('seo_metadata', 'meta_description')) {
                $table->renameColumn('meta_description', 'description');
            }
            if (Schema::hasColumn('seo_metadata', 'meta_keywords')) {
                $table->renameColumn('meta_keywords', 'keywords');
            }
        });
    }
};
