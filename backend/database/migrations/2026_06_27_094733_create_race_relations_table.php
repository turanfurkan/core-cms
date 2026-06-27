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
        Schema::create('race_relations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('races')->onDelete('cascade');
            $table->foreignId('child_id')->constrained('races')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['parent_id', 'child_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('race_relations');
    }
};
