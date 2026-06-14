<?php

use App\Domains\Identity\Http\Controllers\Admin\UserController as AdminUserController;
use App\Domains\Identity\Http\Controllers\Admin\RoleController;
use App\Domains\Identity\Http\Controllers\Admin\PermissionController;
use App\Domains\Identity\Http\Controllers\Auth\ForgotPasswordController;
use App\Domains\Identity\Http\Controllers\Auth\LoginController;
use App\Domains\Identity\Http\Controllers\Auth\LogoutController;
use App\Domains\Identity\Http\Controllers\Auth\RegisterController;
use App\Domains\Identity\Http\Controllers\Auth\ResetPasswordController;
use App\Domains\Identity\Http\Controllers\Auth\SendOtpController;
use App\Domains\Identity\Http\Controllers\Auth\VerifyOtpController;
use App\Domains\Identity\Http\Controllers\Profile\ProfileController;
use App\Domains\Content\Http\Controllers\Admin\ContentTypeController;
use App\Domains\Content\Http\Controllers\Admin\ContentEntryController;
use App\Domains\Content\Http\Controllers\Public\ContentDeliveryController;
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
    Route::post('/profile/consents', [ProfileController::class, 'storeConsent']);
    Route::post('/profile/documents', [ProfileController::class, 'uploadDocument']);

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
    Route::get('/admin/users', [AdminUserController::class, 'index'])
        ->middleware('can:user.viewAny');
    Route::get('/admin/users/{user}', [AdminUserController::class, 'show'])
        ->middleware('can:user.view.any');
    Route::post('/admin/users', [AdminUserController::class, 'store'])
        ->middleware('can:user.create');
    Route::put('/admin/users/{user}', [AdminUserController::class, 'update'])
        ->middleware('can:user.update.any');
    Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy'])
        ->middleware('can:user.delete');
    Route::post('/admin/users/{user}/restore', [AdminUserController::class, 'restore'])
        ->middleware('can:user.update.any');

    Route::patch('/admin/users/{user}/status', [AdminUserController::class, 'updateStatus'])
        ->middleware('can:user.update.any');
    Route::patch('/admin/users/{user}/roles', [AdminUserController::class, 'syncRoles'])
        ->middleware('can:role.assign');
    Route::post('/admin/users/{user}/impersonate', [AdminUserController::class, 'impersonate'])
        ->middleware('can:user.view.any');

    // Roles & Permissions Management
    Route::get('/admin/roles', [RoleController::class, 'index']);
    Route::get('/admin/permissions', [PermissionController::class, 'index']);

    // Admin Content Type Schemas Management
    Route::apiResource('/admin/content-types', ContentTypeController::class);

    // Admin Content Entries Management
    Route::get('/admin/content-types/{content_type}/entries', [ContentEntryController::class, 'index']);
    Route::post('/admin/content-types/{content_type}/entries', [ContentEntryController::class, 'store']);
    Route::get('/admin/content-types/{content_type}/entries/{content_entry}', [ContentEntryController::class, 'show']);
    Route::put('/admin/content-types/{content_type}/entries/{content_entry}', [ContentEntryController::class, 'update']);
    Route::delete('/admin/content-types/{content_type}/entries/{content_entry}', [ContentEntryController::class, 'destroy']);
    Route::post('/admin/content-types/{content_type}/entries/{content_entry}/publish', [ContentEntryController::class, 'publish']);
    Route::post('/admin/content-types/{content_type}/entries/{content_entry}/revisions/{content_revision}/rollback', [ContentEntryController::class, 'rollback']);

    // Media Folders Management
    Route::get('/admin/media/folders', [\App\Domains\Media\Http\Controllers\Admin\FolderController::class, 'index']);
    Route::post('/admin/media/folders', [\App\Domains\Media\Http\Controllers\Admin\FolderController::class, 'store']);
    Route::get('/admin/media/folders/{folder}', [\App\Domains\Media\Http\Controllers\Admin\FolderController::class, 'show']);
    Route::put('/admin/media/folders/{folder}', [\App\Domains\Media\Http\Controllers\Admin\FolderController::class, 'update']);
    Route::post('/admin/media/folders/{folder}/move', [\App\Domains\Media\Http\Controllers\Admin\FolderController::class, 'move']);
    Route::delete('/admin/media/folders/{folder}', [\App\Domains\Media\Http\Controllers\Admin\FolderController::class, 'destroy']);

    // Media Files Management
    Route::get('/admin/media/files', [\App\Domains\Media\Http\Controllers\Admin\MediaController::class, 'index']);
    Route::post('/admin/media/files', [\App\Domains\Media\Http\Controllers\Admin\MediaController::class, 'store']);
    Route::get('/admin/media/files/{media}', [\App\Domains\Media\Http\Controllers\Admin\MediaController::class, 'show']);
    Route::put('/admin/media/files/{media}/meta', [\App\Domains\Media\Http\Controllers\Admin\MediaController::class, 'updateMeta']);
    Route::post('/admin/media/files/{media}/move', [\App\Domains\Media\Http\Controllers\Admin\MediaController::class, 'move']);
    Route::delete('/admin/media/files/{media}', [\App\Domains\Media\Http\Controllers\Admin\MediaController::class, 'destroy']);

    // Workflows Management
    Route::get('/admin/workflows', [\App\Domains\Workflow\Http\Controllers\Admin\WorkflowController::class, 'index']);
    Route::post('/admin/workflows', [\App\Domains\Workflow\Http\Controllers\Admin\WorkflowController::class, 'store']);
    Route::get('/admin/workflows/{workflow}', [\App\Domains\Workflow\Http\Controllers\Admin\WorkflowController::class, 'show']);
    Route::delete('/admin/workflows/{workflow}', [\App\Domains\Workflow\Http\Controllers\Admin\WorkflowController::class, 'destroy']);

    // Workflow Transitions
    Route::get('/admin/workflows/transitions/{resource_type}/{resource_id}', [\App\Domains\Workflow\Http\Controllers\Admin\WorkflowTransitionController::class, 'availableTransitions']);
    Route::post('/admin/workflows/transitions/{resource_type}/{resource_id}', [\App\Domains\Workflow\Http\Controllers\Admin\WorkflowTransitionController::class, 'triggerTransition']);
    Route::get('/admin/workflows/history/{resource_type}/{resource_id}', [\App\Domains\Workflow\Http\Controllers\Admin\WorkflowTransitionController::class, 'history']);
});

// Public Content Delivery API (Read-only)
Route::get('/content/delivery/{contentTypeSlug}', [ContentDeliveryController::class, 'index']);
Route::get('/content/delivery/{contentTypeSlug}/{entrySlug}', [ContentDeliveryController::class, 'show']);
