<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('navigations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('key')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('navigation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('navigation_id')->constrained('navigations')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('navigation_items')->cascadeOnDelete();
            $table->json('title'); // Localized titles, e.g., {"en": "Home", "tr": "Anasayfa"}
            $table->string('type')->default('custom'); // custom, content
            $table->string('url')->nullable(); // custom url path
            $table->nullableMorphs('linked_resource'); // polymorphic link to entries, categories, etc.
            $table->string('target')->default('_self'); // _self, _blank
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('navigation_items');
        Schema::dropIfExists('navigations');
    }
};
