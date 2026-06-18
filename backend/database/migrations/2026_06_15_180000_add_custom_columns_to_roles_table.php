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
        $tableNames = config('permission.table_names');
        $rolesTable = $tableNames['roles'] ?? 'roles';

        Schema::table($rolesTable, function (Blueprint $table) {
            if (!Schema::hasColumn($table->getTable(), 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn($table->getTable(), 'is_protected')) {
                $table->boolean('is_protected')->default(false);
            }
            if (!Schema::hasColumn($table->getTable(), 'is_default')) {
                $table->boolean('is_default')->default(false);
            }
        });

        Schema::create('verification_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('identifier');
            $table->string('token')->unique();
            $table->dateTime('expires');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tableNames = config('permission.table_names');
        $rolesTable = $tableNames['roles'] ?? 'roles';

        Schema::table($rolesTable, function (Blueprint $table) {
            $table->dropColumn(['description', 'is_protected', 'is_default']);
        });

        Schema::dropIfExists('verification_tokens');
    }
};
