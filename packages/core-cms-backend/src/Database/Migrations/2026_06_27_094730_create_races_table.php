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
        Schema::create('races', function (Blueprint $table) {
            $table->id();
            $table->json('title'); // Localized: {"tr": "...", "en": "..."}
            $table->json('slug');  // Localized: {"tr": "...", "en": "..."}
            $table->json('content')->nullable(); // Localized description
            $table->date('start_date');
            $table->string('start_time')->nullable();
            $table->text('location_embed')->nullable(); // HTML map embed iframe
            $table->decimal('price', 10, 2)->default(0.00);
            $table->decimal('discounted_price', 10, 2)->default(0.00);
            $table->date('registration_deadline');
            $table->integer('max_participants')->default(0);
            
            // Specifications
            $table->string('distance')->nullable();
            $table->string('start_point')->nullable();
            $table->string('finish_point')->nullable();
            $table->string('elevation')->nullable();
            $table->string('descent')->nullable();
            
            // Media ID references
            $table->unsignedBigInteger('cover_image_id')->nullable();
            $table->unsignedBigInteger('graphic_image_id')->nullable();
            $table->unsignedBigInteger('gpx_file_id')->nullable();
            $table->unsignedBigInteger('strava_file_id')->nullable();
            $table->json('gallery_ids')->nullable(); // list of media ids
            
            $table->text('youtube_embed')->nullable();
            $table->boolean('is_multi_race')->default(false);
            $table->string('manager_name')->nullable();
            $table->string('manager_phone')->nullable();
            $table->boolean('is_sales_active')->default(true);
            $table->integer('contest_id')->nullable();
            $table->boolean('is_free')->default(false);
            $table->integer('order')->default(0);
            $table->string('status')->default('published'); // draft, published, archived
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('races');
    }
};
