<?php

use Illuminate\Support\Facades\Route;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Admin\UserController as AdminUserController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Admin\RoleController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Admin\PermissionController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth\ForgotPasswordController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth\LoginController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth\LogoutController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth\RegisterController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth\ResetPasswordController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth\SendOtpController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth\VerifyOtpController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth\FrontendVerificationController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Auth\SocialLoginController;
use TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Profile\ProfileController;
use TuranFurkan\CoreCms\Domains\Category\Http\Controllers\Admin\CategoryController;
use TuranFurkan\CoreCms\Domains\Race\Http\Controllers\Admin\RaceController;
use TuranFurkan\CoreCms\Domains\Race\Http\Controllers\Admin\ParticipantController;
use TuranFurkan\CoreCms\Domains\Race\Http\Controllers\Admin\RegistrationController;

use TuranFurkan\CoreCms\Domains\Navigation\Http\Controllers\Admin\NavigationController as AdminNavigationController;
use TuranFurkan\CoreCms\Domains\Navigation\Http\Controllers\PublicNavigationController;
use TuranFurkan\CoreCms\Domains\Settings\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use TuranFurkan\CoreCms\Domains\Settings\Http\Controllers\PublicSettingsController;

Route::middleware(['api', 'auth:sanctum'])->prefix('api')->group(function (): void {
    // User Profile Routes
    Route::get('/user', [ProfileController::class, 'show']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile/password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);
    Route::post('/profile/consents', [ProfileController::class, 'storeConsent']);
    Route::post('/profile/documents', [ProfileController::class, 'uploadDocument']);
    Route::get('/profile/notifications', [\TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\UserNotificationController::class, 'index']);
    Route::patch('/profile/notifications/{id}/read', [\TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\UserNotificationController::class, 'markAsRead']);
    Route::post('/profile/notifications/read-all', [\TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\UserNotificationController::class, 'markAllAsRead']);
    Route::delete('/profile/notifications/{id}', [\TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\UserNotificationController::class, 'destroy']);

    Route::post('/auth/logout', LogoutController::class);
});

// Authentication Throttle & Verification Routes
Route::middleware(['api', 'throttle:6,1'])->prefix('api')->group(function (): void {
    Route::post('/auth/register', RegisterController::class);
});

Route::middleware(['api', 'throttle:login'])->prefix('api')->group(function (): void {
    Route::post('/auth/login', LoginController::class);
});

Route::middleware(['api', 'throttle:otp-send'])->prefix('api')->group(function (): void {
    Route::post('/auth/otp/send', SendOtpController::class);
});

Route::middleware(['api'])->prefix('api')->group(function (): void {
    Route::post('/auth/otp/verify', VerifyOtpController::class);
    Route::post('/auth/social', SocialLoginController::class);
    Route::post('/auth/password/forgot', ForgotPasswordController::class);

    // This route is required for Laravel reset password link generation
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
});

// Admin Domain Routes
Route::middleware(['api', 'auth:sanctum'])->prefix('api')->group(function (): void {
    Route::get('/admin/users', [AdminUserController::class, 'index'])
        ->middleware('can:user.viewAny');
    Route::get('/admin/activity-logs', [\TuranFurkan\CoreCms\Domains\Identity\Http\Controllers\Admin\ActivityLogController::class, 'index'])
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

    // Admin Categories Management
    Route::post('/admin/categories/reorder', [CategoryController::class, 'reorder']);
    Route::apiResource('/admin/categories', CategoryController::class);

    // Admin Races Management
    Route::post('/admin/races/reorder', [RaceController::class, 'reorder']);
    Route::apiResource('/admin/races', RaceController::class);

    // Admin Race Participants & Registrations Management
    Route::get('/admin/race-participants/nationalities', [ParticipantController::class, 'nationalities']);
    Route::apiResource('/admin/race-participants', ParticipantController::class);
    Route::apiResource('/admin/race-registrations', RegistrationController::class);
    Route::apiResource('/admin/orders', \TuranFurkan\CoreCms\Domains\Billing\Http\Controllers\Admin\OrderController::class);

    // Admin Posts Management
    Route::apiResource('/admin/posts', \TuranFurkan\CoreCms\Domains\Post\Http\Controllers\Admin\PostController::class);

    // Admin Pages Management
    Route::apiResource('/admin/pages', \TuranFurkan\CoreCms\Domains\Page\Http\Controllers\Admin\PageController::class);

    // Admin Global Blocks Management
    Route::apiResource('/admin/global-blocks', \TuranFurkan\CoreCms\Domains\GlobalBlock\Http\Controllers\Admin\GlobalBlockController::class);

    // Media Folders Management
    Route::get('/admin/media/folders', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\FolderController::class, 'index']);
    Route::post('/admin/media/folders', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\FolderController::class, 'store']);
    Route::get('/admin/media/folders/{folder}', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\FolderController::class, 'show']);
    Route::put('/admin/media/folders/{folder}', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\FolderController::class, 'update']);
    Route::post('/admin/media/folders/{folder}/move', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\FolderController::class, 'move']);
    Route::delete('/admin/media/folders/{folder}', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\FolderController::class, 'destroy']);

    // Media Files Management
    Route::get('/admin/media/files', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\MediaController::class, 'index']);
    Route::post('/admin/media/files', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\MediaController::class, 'store']);
    Route::get('/admin/media/files/{media}', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\MediaController::class, 'show']);
    Route::put('/admin/media/files/{media}/meta', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\MediaController::class, 'updateMeta']);
    Route::post('/admin/media/files/{media}/move', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\MediaController::class, 'move']);
    Route::delete('/admin/media/files/{media}', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\MediaController::class, 'destroy']);

    // Workflows Management
    Route::get('/admin/workflows', [\TuranFurkan\CoreCms\Domains\Workflow\Http\Controllers\Admin\WorkflowController::class, 'index']);
    Route::post('/admin/workflows', [\TuranFurkan\CoreCms\Domains\Workflow\Http\Controllers\Admin\WorkflowController::class, 'store']);
    Route::get('/admin/workflows/{workflow}', [\TuranFurkan\CoreCms\Domains\Workflow\Http\Controllers\Admin\WorkflowController::class, 'show']);
    Route::delete('/admin/workflows/{workflow}', [\TuranFurkan\CoreCms\Domains\Workflow\Http\Controllers\Admin\WorkflowController::class, 'destroy']);

    // Workflow Transitions
    Route::get('/admin/workflows/transitions/{resource_type}/{resource_id}', [\TuranFurkan\CoreCms\Domains\Workflow\Http\Controllers\Admin\WorkflowTransitionController::class, 'availableTransitions']);
    Route::post('/admin/workflows/transitions/{resource_type}/{resource_id}', [\TuranFurkan\CoreCms\Domains\Workflow\Http\Controllers\Admin\WorkflowTransitionController::class, 'triggerTransition']);
    Route::get('/admin/workflows/history/{resource_type}/{resource_id}', [\TuranFurkan\CoreCms\Domains\Workflow\Http\Controllers\Admin\WorkflowTransitionController::class, 'history']);

    // Languages Management
    Route::get('/admin/languages', [\TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'index']);
    Route::post('/admin/languages', [\TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'store']);
    Route::get('/admin/languages/{language}', [\TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'show']);
    Route::put('/admin/languages/{language}', [\TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'update']);
    Route::delete('/admin/languages/{language}', [\TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin\LanguageController::class, 'destroy']);

    // Translations Management
    Route::get('/admin/translations', [\TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin\TranslationController::class, 'index']);
    Route::post('/admin/translations', [\TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin\TranslationController::class, 'store']);
    Route::delete('/admin/translations/{translation}', [\TuranFurkan\CoreCms\Domains\Localization\Http\Controllers\Admin\TranslationController::class, 'destroy']);

    // Forms Management
    Route::get('/admin/forms', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin\FormController::class, 'index']);
    Route::post('/admin/forms', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin\FormController::class, 'store']);
    Route::get('/admin/forms/{form}', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin\FormController::class, 'show']);
    Route::put('/admin/forms/{form}', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin\FormController::class, 'update']);
    Route::delete('/admin/forms/{form}', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin\FormController::class, 'destroy']);

    // Form Submissions Management
    Route::get('/admin/forms/submissions', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin\FormSubmissionController::class, 'index']);
    Route::get('/admin/forms/submissions/{submission}', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin\FormSubmissionController::class, 'show']);
    Route::patch('/admin/forms/submissions/{submission}/status', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin\FormSubmissionController::class, 'updateStatus']);
    Route::delete('/admin/forms/submissions/{submission}', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin\FormSubmissionController::class, 'destroy']);

    // Notification Templates Management
    Route::get('/admin/notification-templates', [\TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'index']);
    Route::post('/admin/notification-templates', [\TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'store']);
    Route::get('/admin/notification-templates/{template}', [\TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'show']);
    Route::put('/admin/notification-templates/{template}', [\TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'update']);
    Route::delete('/admin/notification-templates/{template}', [\TuranFurkan\CoreCms\Domains\Notification\Http\Controllers\Admin\NotificationTemplateController::class, 'destroy']);

    // Webhooks & Integration Management
    Route::get('/admin/webhooks', [\TuranFurkan\CoreCms\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'index']);
    Route::post('/admin/webhooks', [\TuranFurkan\CoreCms\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'store']);
    Route::get('/admin/webhooks/{webhook}', [\TuranFurkan\CoreCms\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'show']);
    Route::put('/admin/webhooks/{webhook}', [\TuranFurkan\CoreCms\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'update']);
    Route::delete('/admin/webhooks/{webhook}', [\TuranFurkan\CoreCms\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'destroy']);
    Route::post('/admin/webhooks/{webhook}/test', [\TuranFurkan\CoreCms\Domains\Integration\Http\Controllers\Admin\WebhookController::class, 'test']);
    Route::get('/admin/webhooks/{webhook}/logs', [\TuranFurkan\CoreCms\Domains\Integration\Http\Controllers\Admin\WebhookLogController::class, 'index']);
    Route::post('/admin/webhooks/{webhook}/logs/{log}/retry', [\TuranFurkan\CoreCms\Domains\Integration\Http\Controllers\Admin\WebhookLogController::class, 'retry']);

    // SEO Paths Management
    Route::get('/admin/seo/paths', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'index']);
    Route::post('/admin/seo/paths', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'store']);
    Route::get('/admin/seo/paths/{path}', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'show']);
    Route::put('/admin/seo/paths/{path}', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'update']);
    Route::delete('/admin/seo/paths/{path}', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoPathController::class, 'destroy']);

    // SEO Redirects Management
    Route::get('/admin/seo/redirects', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'index']);
    Route::post('/admin/seo/redirects', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'store']);
    Route::get('/admin/seo/redirects/{redirect}', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'show']);
    Route::put('/admin/seo/redirects/{redirect}', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'update']);
    Route::delete('/admin/seo/redirects/{redirect}', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Admin\SeoRedirectController::class, 'destroy']);

    // API Keys Management
    Route::get('/admin/api-keys', [\TuranFurkan\CoreCms\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'index']);
    Route::post('/admin/api-keys', [\TuranFurkan\CoreCms\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'store']);
    Route::get('/admin/api-keys/{apiKey}', [\TuranFurkan\CoreCms\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'show']);
    Route::put('/admin/api-keys/{apiKey}', [\TuranFurkan\CoreCms\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'update']);
    Route::delete('/admin/api-keys/{apiKey}', [\TuranFurkan\CoreCms\Domains\API\Http\Controllers\Admin\ApiKeyController::class, 'destroy']);

    // Subscriber Management
    Route::get('/admin/subscribers', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'index']);
    Route::post('/admin/subscribers', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'store']);
    Route::get('/admin/subscribers/{subscriber}', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'show']);
    Route::put('/admin/subscribers/{subscriber}', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'update']);
    Route::delete('/admin/subscribers/{subscriber}', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\SubscriberController::class, 'destroy']);

    // Campaign Management
    Route::get('/admin/campaigns', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'index']);
    Route::post('/admin/campaigns', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'store']);
    Route::get('/admin/campaigns/{campaign}', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'show']);
    Route::post('/admin/campaigns/{campaign}/send', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'send']);
    Route::delete('/admin/campaigns/{campaign}', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin\CampaignController::class, 'destroy']);

    // Marketing Promotions Management
    Route::get('/admin/marketing/promotions', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'index']);
    Route::post('/admin/marketing/promotions', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'store']);
    Route::get('/admin/marketing/promotions/{promotion}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'show']);
    Route::put('/admin/marketing/promotions/{promotion}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'update']);
    Route::delete('/admin/marketing/promotions/{promotion}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminPromotionController::class, 'destroy']);

    // Marketing Coupons Management
    Route::get('/admin/marketing/coupons', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'index']);
    Route::post('/admin/marketing/coupons', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'store']);
    Route::get('/admin/marketing/coupons/{coupon}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'show']);
    Route::put('/admin/marketing/coupons/{coupon}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'update']);
    Route::delete('/admin/marketing/coupons/{coupon}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminCouponController::class, 'destroy']);

    // Marketing Widgets Management
    Route::get('/admin/marketing/widgets', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'index']);
    Route::post('/admin/marketing/widgets', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'store']);
    Route::get('/admin/marketing/widgets/{widget}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'show']);
    Route::put('/admin/marketing/widgets/{widget}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'update']);
    Route::delete('/admin/marketing/widgets/{widget}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin\AdminWidgetController::class, 'destroy']);

    // Partner & Sponsor Management
    Route::get('/admin/partners', [\TuranFurkan\CoreCms\Domains\Partner\Http\Controllers\Admin\PartnerController::class, 'index']);
    Route::post('/admin/partners', [\TuranFurkan\CoreCms\Domains\Partner\Http\Controllers\Admin\PartnerController::class, 'store']);
    Route::get('/admin/partners/{partner}', [\TuranFurkan\CoreCms\Domains\Partner\Http\Controllers\Admin\PartnerController::class, 'show']);
    Route::put('/admin/partners/{partner}', [\TuranFurkan\CoreCms\Domains\Partner\Http\Controllers\Admin\PartnerController::class, 'update']);
    Route::delete('/admin/partners/{partner}', [\TuranFurkan\CoreCms\Domains\Partner\Http\Controllers\Admin\PartnerController::class, 'destroy']);

    // Navigations Management
    Route::get('/admin/navigations', [AdminNavigationController::class, 'index']);
    Route::post('/admin/navigations', [AdminNavigationController::class, 'store']);
    Route::get('/admin/navigations/{navigation}', [AdminNavigationController::class, 'show']);
    Route::put('/admin/navigations/{navigation}', [AdminNavigationController::class, 'update']);
    Route::delete('/admin/navigations/{navigation}', [AdminNavigationController::class, 'destroy']);

    // Settings Management
    Route::get('/admin/settings', [AdminSettingsController::class, 'index']);
    Route::put('/admin/settings', [AdminSettingsController::class, 'update']);
});

// Public Content Delivery API (Read-only)
Route::middleware(['api', 'api_key:content:read'])->prefix('api')->group(function (): void {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/media/files/{media}', [\TuranFurkan\CoreCms\Domains\Media\Http\Controllers\Admin\MediaController::class, 'show']);
    Route::get('/content/delivery/partners', [\TuranFurkan\CoreCms\Domains\Partner\Http\Controllers\Public\PartnerController::class, 'index']);
    Route::get('/content/delivery/blog', [\TuranFurkan\CoreCms\Domains\Post\Http\Controllers\Public\PostController::class, 'index']);
    Route::get('/content/delivery/blog/{slug}', [\TuranFurkan\CoreCms\Domains\Post\Http\Controllers\Public\PostController::class, 'show']);
    Route::get('/pages/{slug}', [\TuranFurkan\CoreCms\Domains\Page\Http\Controllers\Public\PageController::class, 'show']);
    Route::get('/races/{race}/participants', [RaceController::class, 'publicParticipants']);
});

Route::middleware(['api'])->prefix('api')->group(function (): void {
    // Public Form Delivery & Submission API
    Route::middleware('api_key:forms:read')->get('/forms/{slug}', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\PublicFormController::class, 'show']);
    Route::middleware(['api_key:forms:submit', 'throttle:5,1'])->post('/forms/{slug}/submit', [\TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\PublicFormController::class, 'submit']);

    // Public SEO Endpoints
    Route::middleware('api_key:seo:read')->group(function (): void {
        Route::get('/seo/redirects/resolve', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Public\PublicSeoController::class, 'resolveRedirect']);
        Route::get('/seo/metadata/resolve', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Public\PublicSeoController::class, 'resolvePathSeo']);
        Route::get('/seo/sitemap', [\TuranFurkan\CoreCms\Domains\SEO\Http\Controllers\Public\PublicSeoController::class, 'sitemap']);
    });

    // Public Subscriber Newsletter Endpoints
    Route::post('/subscribers/subscribe', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Public\PublicSubscriberController::class, 'subscribe']);
    Route::get('/subscribers/unsubscribe/{subscriber}', [\TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Public\PublicSubscriberController::class, 'unsubscribe'])
        ->name('subscribers.unsubscribe');

    // Public Marketing API
    Route::middleware('api_key:marketing:read')->group(function (): void {
        Route::get('/marketing/promotions', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Public\PublicPromotionController::class, 'index']);
        Route::post('/marketing/coupons/validate', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Public\PublicCouponController::class, 'validateCoupon']);
        Route::post('/marketing/coupons/redeem', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Public\PublicCouponController::class, 'redeemCoupon']);
        Route::get('/marketing/widgets/{key}', [\TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Public\PublicWidgetController::class, 'show']);
    });

    // Public Navigation API
    Route::middleware('api_key:navigation:read')->get('/navigations/{key}', [PublicNavigationController::class, 'show']);

    // Public Settings API
    Route::middleware('api_key:settings:read')->get('/settings/public', [PublicSettingsController::class, 'index']);
});

// PayTR Webhook Callback (Public)
Route::post('/api/payments/paytr/callback', [\TuranFurkan\CoreCms\Domains\Billing\Http\Controllers\PaytrCallbackController::class, 'handle']);
