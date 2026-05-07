<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('login_otps', function (Blueprint $table): void {
            $table->string('purpose', 32)->default('login')->after('phone');
            $table->string('delivery_status', 16)->default('queued')->after('max_attempts');
            $table->string('ip_address', 45)->nullable()->after('delivery_status');
            $table->string('user_agent', 191)->nullable()->after('ip_address');
            $table->uuid('request_id')->nullable()->after('user_agent');

            $table->index(['phone', 'purpose', 'consumed_at']);
        });
    }

    public function down(): void
    {
        Schema::table('login_otps', function (Blueprint $table): void {
            $table->dropIndex(['phone', 'purpose', 'consumed_at']);
            $table->dropColumn([
                'purpose',
                'delivery_status',
                'ip_address',
                'user_agent',
                'request_id',
            ]);
        });
    }
};
