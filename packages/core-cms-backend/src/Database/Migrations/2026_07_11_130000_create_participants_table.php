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
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('gender', 10); // 'male', 'female', etc.
            $table->date('date_of_birth');
            $table->string('identity_number')->nullable();
            $table->string('blood_type', 10)->nullable();
            $table->string('phone_number');
            $table->string('t_shirt_size', 10)->nullable();
            $table->string('club_name')->nullable();
            $table->string('nationality', 50)->default('TR');
            $table->string('emergency_contact')->nullable();
            $table->string('emergency_phone_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
