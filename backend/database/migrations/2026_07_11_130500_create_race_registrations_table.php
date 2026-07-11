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
        Schema::create('race_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('participants')->cascadeOnDelete();
            $table->foreignId('race_id')->constrained('races')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // The user who booked/paid
            $table->foreignId('race_category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('bib_number', 50)->nullable();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->string('status', 20)->default('pending'); // 'pending', 'paid', 'cancelled', etc.
            $table->string('payment_id')->nullable(); // Reference to payment transactions
            $table->unsignedBigInteger('group_id')->nullable(); // If registered under a group
            $table->timestamps();

            // Prevent duplicate registration for the same participant in the same race
            $table->unique(['race_id', 'participant_id']);
            // Prevent duplicate bib number within the same race
            $table->unique(['race_id', 'bib_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('race_registrations');
    }
};
