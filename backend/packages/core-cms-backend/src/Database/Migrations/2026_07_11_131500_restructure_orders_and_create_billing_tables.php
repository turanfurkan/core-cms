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
        // 1. Restructure orders table (remove single orderable columns)
        Schema::table('orders', function (Blueprint $table) {
            $table->dropMorphs('orderable');
        });

        // 2. Create order_items table
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->morphs('orderable'); // polymorphic relation: orderable_type, orderable_id
            $table->decimal('price', 10, 2);
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });

        // 3. Create payment_transactions table
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('gateway'); // e.g., 'paytr', 'stripe'
            $table->string('transaction_id')->nullable(); // e.g., merchant_oid
            $table->decimal('amount', 10, 2);
            $table->string('status', 20)->default('pending'); // 'pending', 'success', 'failed'
            $table->json('payload')->nullable(); // gateway response payload
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('order_items');

        Schema::table('orders', function (Blueprint $table) {
            $table->nullableMorphs('orderable');
        });
    }
};
