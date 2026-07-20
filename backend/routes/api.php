<?php

use Illuminate\Support\Facades\Route;

// API health check
Route::get('/health', function (): array {
    return [
        'status' => 'ok',
        'version' => config('app.version'),
    ];
});

// Public Statistics Counts
Route::get('/public/statistics/counts', [\App\Http\Controllers\PublicStatisticsController::class, 'counts']);

// Admin Database Sync Route
Route::middleware(['api', 'auth:sanctum'])->group(function () {
    Route::post('/admin/database-sync', [\App\Http\Controllers\Admin\DatabaseSyncController::class, 'sync']);
});
