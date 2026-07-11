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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->json('title'); // Localized: {"tr": "...", "en": "..."}
            $table->json('slug');  // Localized: {"tr": "...", "en": "..."}
            $table->json('content')->nullable(); // Localized rich text
            $table->json('summary')->nullable(); // Localized short summary
            
            $table->unsignedBigInteger('cover_image_id')->nullable();
            $table->integer('reading_time')->nullable(); // in minutes
            $table->dateTime('publish_date')->nullable();
            $table->string('status')->default('draft'); // draft, published, archived
            
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            
            $table->softDeletes();
            $table->timestamps();

            // Constraints
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
