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
use App\Domains\Identity\Http\Controllers\Auth\FrontendVerificationController;
use App\Domains\Identity\Http\Controllers\Profile\ProfileController;
use App\Domains\Content\Http\Controllers\Admin\ContentTypeController;
use App\Domains\Content\Http\Controllers\Admin\ContentEntryController;
use App\Domains\Content\Http\Controllers\Public\ContentDeliveryController;
use App\Domains\Category\Http\Controllers\Admin\CategoryController;
use App\Domains\Race\Http\Controllers\Admin\RaceController;
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
    Route::get('/profile/notifications', [\App\Domains\Notification\Http\Controllers\UserNotificationController::class, 'index']);
    Route::patch('/profile/notifications/{id}/read', [\App\Domains\Notification\Http\Controllers\UserNotificationController::class, 'markAsRead']);
    Route::post('/profile/notifications/read-all', [\App\Domains\Notification\Http\Controllers\UserNotificationController::class, 'markAllAsRead']);
    Route::delete('/profile/notifications/{id}', [\App\Domains\Notification\Http\Controllers\UserNotificationController::class, 'destroy']);

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

Route::post('/auth/frontend/reset-password', [FrontendVerificationController::class, 'generateResetToken']);
Route::post('/auth/frontend/reset-password-verify', [FrontendVerificationController::class, 'verifyResetToken']);
Route::post('/auth/frontend/change-password', [FrontendVerificationController::class, 'changePassword']);
Route::post('/auth/frontend/verify-email', [FrontendVerificationController::class, 'verifyEmail']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/admin/users', [AdminUserController::class, 'index'])
        ->middleware('can:user.viewAny');
    Route::get('/admin/activity-logs', [\App\Domains\Identity\Http\Controllers\Admin\ActivityLogController::class, 'index'])
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
    Route::get('/admin/roles/{id}', [RoleController::class, 'show']);
    Route::post('/admin/roles', [RoleController::class, 'store']);
    Route::put('/admin/roles/{id}', [RoleController::class, 'update']);
    Route::delete('/admin/roles/{id}', [RoleController::class, 'destroy']);
    Route::patch('/admin/roles/{id}/default', [RoleController::class, 'setDefault']);

    Route::get('/admin/permissions', [PermissionController::class, 'index']);
    Route::get('/admin/permissions/{id}', [PermissionController::class, 'show']);
    Route::post('/admin/permissions', [PermissionController::class, 'store']);
    Route::put('/admin/permissions/{id}', [PermissionController::class, 'update']);
    Route::delete('/admin/permissions/{id}', [PermissionController::class, 'destroy']);
    Route::post('/admin/permissions/delete', [PermissionController::class, 'bulkDestroy']);

    // Admin Content Type Schemas Management
    Route::post('/admin/content-types/reorder', [ContentTypeController::class, 'reorder']);
    Route::apiResource('/admin/content-types', ContentTypeController::class);

    // Admin Categories Management
    Route::post('/admin/categories/reorder', [CategoryController::class, 'reorder']);
    Route::apiResource('/admin/categories', CategoryController::class);

    // Admin Races Management
    Route::post('/admin/races/reorder', [RaceController::class, 'reorder']);
    Route::apiResource('/admin/races', RaceController::class);

    // Admin Posts Management
    Route::apiResource('/admin/posts', \App\Domains\Post\Http\Controllers\Admin\PostController::class);

    // Admin Content Entries Management
    Route::get('/admin/content-types/{content_type}/entries', [ContentEntryController::class, 'index']);
    Route::post('/admin/content-types/{content_type}/entries', [ContentEntryController::class, 'store']);
    Route::get('/admin/content-types/{content_type}/entries/{content_entry}', [ContentEntryController::class, 'show']);
    Route::put('/admin/content-types/{content_type}/entries/{content_entry}', [ContentEntryController::class, 'update']);
    Route::delete('/admin/content-types/{content_type}/entries/{content_entry}', [ContentEntryController::class, 'destroy']);
    Route::post('/admin/content-types/{content_type}/entries/{content_entry}/publish', [ContentEntryController::class, 'publish']);
    Route::get('/admin/content-types/{content_type}/entries/{content_entry}/revisions', [ContentEntryController::class, 'revisions']);
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

    // Languages Management
    Route::get('/admin/languages', [\App\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'index']);
    Route::post('/admin/languages', [\App\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'store']);
    Route::get('/admin/languages/{language}', [\App\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'show']);
    Route::put('/admin/languages/{language}', [\App\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'update']);
    Route::delete('/admin/languages/{language}', [\App\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'destroy']);

    // Translations Management
    Route::get('/admin/translations', [\App\Domains\Localization\Http\Controllers\Admin\TranslationController::class, 'index']);
    Route::post('/admin/translations', [\App\Domains\Localization\Http\Controllers\Admin\TranslationController::class, 'store']);
    Route::delete('/admin/translations/{translation}', [\App\Domains\Localization\Http\Controllers\Admin\TranslationController::class, 'destroy']);

    // Forms Management
    Route::get('/admin/forms', [\App\Domains\Forms\Http\Controllers\Admin\FormController::class, 'index']);
    Route::post('/admin/forms', [\App\Domains\Forms\Http\Controllers\Admin\FormController::class, 'store']);
    Route::get('/admin/forms/{form}', [\App\Domains\Forms\Http\Controllers\Admin\FormController::class, 'show']);
    Route::put('/admin/forms/{form}', [\App\Domains\Forms\Http\Controllers\Admin\FormController::class, 'update']);
    Route::delete('/admin/forms/{form}', [\App\Domains\Forms\Http\Controllers\Admin\FormController::class, 'destroy']);

    // Form Submissions Management
    Route::get('/admin/forms/submissions', [\App\Domains\Forms\Http\Controllers\Admin\FormSubmissionController::class, 'index']);
    Route::get('/admin/forms/submissions/{submission}', [\App\Domains\Forms\Http\Controllers\Admin\FormSubmissionController::class, 'show']);
    Route::patch('/admin/forms/submissions/{submission}/status', [\App\Domains\Forms\Http\Controllers\Admin\FormSubmissionController::class, 'updateStatus']);
    Route::delete('/admin/forms/submissions/{submission}', [\App\Domains\Forms\Http\Controllers\Admin\FormSubmissionController::class, 'destroy']);

    // Notification Templates Management
    Route::get('/admin/notification-templates', [\App\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'index']);
    Route::post('/admin/notification-templates', [\App\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'store']);
    Route::get('/admin/notification-templates/{template}', [\App\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'show']);
    Route::put('/admin/notification-templates/{template}', [\App\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'update']);
    Route::delete('/admin/notification-templates/{template}', [\App\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'destroy']);

    // Navigations Management
    Route::get('/admin/navigations', [\App\Domains\Navigation\Http\Controllers\Admin\NavigationController::class, 'index']);
    Route::post('/admin/navigations', [\App\Domains\Navigation\Http\Controllers\Admin\NavigationController::class, 'store']);
    Route::get('/admin/navigations/{navigation}', [\App\Domains\Navigation\Http\Controllers\Admin\NavigationController::class, 'show']);
    Route::put('/admin/navigations/{navigation}', [\App\Domains\Navigation\Http\Controllers\Admin\NavigationController::class, 'update']);
    Route::delete('/admin/navigations/{navigation}', [\App\Domains\Navigation\Http\Controllers\Admin\NavigationController::class, 'destroy']);

    // Webhooks & Integration Management
    Route::get('/admin/webhooks', [\App\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'index']);
    Route::post('/admin/webhooks', [\App\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'store']);
    Route::get('/admin/webhooks/{webhook}', [\App\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'show']);
    Route::put('/admin/webhooks/{webhook}', [\App\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'update']);
    Route::delete('/admin/webhooks/{webhook}', [\App\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'destroy']);
    Route::post('/admin/webhooks/{webhook}/test', [\App\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'test']);
    Route::get('/admin/webhooks/{webhook}/logs', [\App\Domains\Integration\Http\Controllers\Admin\WebhookLogController::class, 'index']);
    Route::post('/admin/webhooks/{webhook}/logs/{log}/retry', [\App\Domains\Integration\Http\Controllers\Admin\WebhookLogController::class, 'retry']);

    // SEO Paths Management
    Route::get('/admin/seo/paths', [\App\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'index']);
    Route::post('/admin/seo/paths', [\App\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'store']);
    Route::get('/admin/seo/paths/{path}', [\App\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'show']);
    Route::put('/admin/seo/paths/{path}', [\App\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'update']);
    Route::delete('/admin/seo/paths/{path}', [\App\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'destroy']);

    // SEO Redirects Management
    Route::get('/admin/seo/redirects', [\App\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'index']);
    Route::post('/admin/seo/redirects', [\App\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'store']);
    Route::get('/admin/seo/redirects/{redirect}', [\App\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'show']);
    Route::put('/admin/seo/redirects/{redirect}', [\App\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'update']);
    Route::delete('/admin/seo/redirects/{redirect}', [\App\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'destroy']);

    // Settings Management
    Route::get('/admin/settings', [\App\Domains\Settings\Http\Controllers\Admin\SettingsController::class, 'index']);
    Route::put('/admin/settings', [\App\Domains\Settings\Http\Controllers\Admin\SettingsController::class, 'update']);

    // API Keys Management
    Route::get('/admin/api-keys', [\App\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'index']);
    Route::post('/admin/api-keys', [\App\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'store']);
    Route::get('/admin/api-keys/{apiKey}', [\App\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'show']);
    Route::put('/admin/api-keys/{apiKey}', [\App\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'update']);
    Route::delete('/admin/api-keys/{apiKey}', [\App\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'destroy']);

    // Subscriber Management
    Route::get('/admin/subscribers', [\App\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'index']);
    Route::post('/admin/subscribers', [\App\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'store']);
    Route::get('/admin/subscribers/{subscriber}', [\App\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'show']);
    Route::put('/admin/subscribers/{subscriber}', [\App\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'update']);
    Route::delete('/admin/subscribers/{subscriber}', [\App\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'destroy']);

    // Campaign Management
    Route::get('/admin/campaigns', [\App\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'index']);
    Route::post('/admin/campaigns', [\App\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'store']);
    Route::get('/admin/campaigns/{campaign}', [\App\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'show']);
    Route::post('/admin/campaigns/{campaign}/send', [\App\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'send']);
    Route::delete('/admin/campaigns/{campaign}', [\App\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'destroy']);

    // Marketing Promotions
    Route::get('/admin/marketing/promotions', [\App\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'index']);
    Route::post('/admin/marketing/promotions', [\App\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'store']);
    Route::get('/admin/marketing/promotions/{promotion}', [\App\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'show']);
    Route::put('/admin/marketing/promotions/{promotion}', [\App\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'update']);
    Route::delete('/admin/marketing/promotions/{promotion}', [\App\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'destroy']);

    // Marketing Coupons
    Route::get('/admin/marketing/coupons', [\App\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'index']);
    Route::post('/admin/marketing/coupons', [\App\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'store']);
    Route::get('/admin/marketing/coupons/{coupon}', [\App\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'show']);
    Route::put('/admin/marketing/coupons/{coupon}', [\App\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'update']);
    Route::delete('/admin/marketing/coupons/{coupon}', [\App\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'destroy']);

    // Marketing Widgets
    Route::get('/admin/marketing/widgets', [\App\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'index']);
    Route::post('/admin/marketing/widgets', [\App\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'store']);
    Route::get('/admin/marketing/widgets/{widget}', [\App\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'show']);
    Route::put('/admin/marketing/widgets/{widget}', [\App\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'update']);
    Route::delete('/admin/marketing/widgets/{widget}', [\App\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'destroy']);
});

// Public Content Delivery API (Read-only)
Route::middleware('api_key:content:read')->group(function (): void {
    // Intercept blog delivery to route to Post domain
    Route::get('/content/delivery/blog', [\App\Domains\Post\Http\Controllers\Public\PostController::class, 'index']);
    Route::get('/content/delivery/blog/{slug}', [\App\Domains\Post\Http\Controllers\Public\PostController::class, 'show']);

    Route::get('/content/delivery/{contentTypeSlug}', [ContentDeliveryController::class, 'index']);
    Route::get('/content/delivery/{contentTypeSlug}/{entrySlug}', [ContentDeliveryController::class, 'show']);
});

// Public Form Delivery & Submission API
Route::middleware('api_key:forms:read')->get('/forms/{slug}', [\App\Domains\Forms\Http\Controllers\PublicFormController::class, 'show']);
Route::middleware(['api_key:forms:submit', 'throttle:5,1'])->post('/forms/{slug}/submit', [\App\Domains\Forms\Http\Controllers\PublicFormController::class, 'submit']);

// Public Navigation API
Route::middleware('api_key:navigation:read')->get('/navigations/{key}', [\App\Domains\Navigation\Http\Controllers\PublicNavigationController::class, 'show']);

// Public SEO Endpoints
Route::middleware('api_key:seo:read')->group(function (): void {
    Route::get('/seo/redirects/resolve', [\App\Domains\SEO\Http\Controllers\Public\PublicSeoController::class, 'resolveRedirect']);
    Route::get('/seo/metadata/resolve', [\App\Domains\SEO\Http\Controllers\Public\PublicSeoController::class, 'resolvePathSeo']);
    Route::get('/seo/sitemap', [\App\Domains\SEO\Http\Controllers\Public\PublicSeoController::class, 'sitemap']);
});

// Public Settings API
Route::middleware('api_key:settings:read')->get('/settings/public', [\App\Domains\Settings\Http\Controllers\Public\PublicSettingsController::class, 'index']);

// Public Subscriber Newsletter Endpoints
Route::post('/subscribers/subscribe', [\App\Domains\Communication\Http\Controllers\Public\PublicSubscriberController::class, 'subscribe']);
Route::get('/subscribers/unsubscribe/{subscriber}', [\App\Domains\Communication\Http\Controllers\Public\PublicSubscriberController::class, 'unsubscribe'])
    ->name('subscribers.unsubscribe');

// Public Marketing API
Route::middleware('api_key:marketing:read')->group(function (): void {
    Route::get('/marketing/promotions', [\App\Domains\Marketing\Http\Controllers\Public\PublicPromotionController::class, 'index']);
    Route::post('/marketing/coupons/validate', [\App\Domains\Marketing\Http\Controllers\Public\PublicCouponController::class, 'validateCoupon']);
    Route::post('/marketing/coupons/redeem', [\App\Domains\Marketing\Http\Controllers\Public\PublicCouponController::class, 'redeemCoupon']);
    Route::get('/marketing/widgets/{key}', [\App\Domains\Marketing\Http\Controllers\Public\PublicWidgetController::class, 'show']);
});
