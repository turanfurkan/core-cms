<?php

use App\Domains\User\Http\Controllers\Admin\UserController as AdminUserController;
use App\Domains\User\Http\Controllers\Auth\ForgotPasswordController;
use App\Domains\User\Http\Controllers\Auth\LoginController;
use App\Domains\User\Http\Controllers\Auth\LogoutController;
use App\Domains\User\Http\Controllers\Auth\RegisterController;
use App\Domains\User\Http\Controllers\Auth\ResetPasswordController;
use App\Domains\User\Http\Controllers\Auth\SendOtpController;
use App\Domains\User\Http\Controllers\Auth\VerifyOtpController;
use App\Domains\User\Http\Controllers\Profile\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

//API health check
Route::get('/health', function (): array {
    return [
        'status' => 'ok',
        'version' => config('app.version'),
    ];
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/user', [ProfileController::class, 'show']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile/password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);

    Route::post('/auth/logout', LogoutController::class);
});

Route::middleware('throttle:6,1')->group(function (): void {
    Route::post('/auth/register', RegisterController::class);
});

Route::middleware('throttle:login')->group(function (): void {
    Route::post('/auth/login', LoginController::class);
});

Route::middleware('throttle:otp-send')->group(function (): void {
    Route::post('/auth/otp/send', SendOtpController::class);
});

Route::post('/auth/otp/verify', VerifyOtpController::class);
Route::post('/auth/password/forgot', ForgotPasswordController::class);

// Bu route Laravel'in mail içindeki linki oluşturabilmesi için zorunludur.
Route::get('/auth/password/reset/{token}', function (string $token) {
    return response()->json([
        'message' => 'Lütfen bu token ile şifrenizi sıfırlayın.',
        'token' => $token
    ]);
})->name('password.reset');

Route::patch('/auth/password/reset', ResetPasswordController::class);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/admin/users', [AdminUserController::class, 'store'])
        ->middleware('can:user.create');
    Route::patch('/admin/users/{user}/status', [AdminUserController::class, 'updateStatus'])
        ->middleware('can:user.update.any');
});
