<?php

use App\Domains\User\Http\Controllers\Admin\UserController as AdminUserController;
use App\Domains\User\Http\Controllers\AuthLoginController;
use App\Domains\User\Http\Controllers\AuthRegisterController;
use App\Domains\User\Http\Controllers\SendOtpController;
use App\Domains\User\Http\Controllers\VerifyOtpController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

//API health check
Route::get('/health', function (): array {
    return [
        'status' => 'ok',
        'version' => config('app.version'),
    ];
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('throttle:6,1')->group(function (): void {
    Route::post('/auth/register', AuthRegisterController::class);
});

Route::middleware('throttle:login')->group(function (): void {
    Route::post('/auth/login', AuthLoginController::class);
});

Route::middleware('throttle:otp-send')->group(function (): void {
    Route::post('/auth/otp/send', SendOtpController::class);
});

Route::post('/auth/otp/verify', VerifyOtpController::class);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/admin/users', [AdminUserController::class, 'store'])
        ->middleware('can:user.create');
});
