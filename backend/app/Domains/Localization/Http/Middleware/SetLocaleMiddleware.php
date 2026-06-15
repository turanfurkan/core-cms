<?php

namespace App\Domains\Localization\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Domains\Localization\Models\Language;
use Illuminate\Support\Facades\Schema;

class SetLocaleMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Detect locale from Request query parameter (e.g. ?locale=en)
        $locale = $request->input('locale');

        // 2. Fall back to X-Locale request header
        if (!$locale) {
            $locale = $request->header('X-Locale');
        }

        // 3. Fall back to Accept-Language browser header
        if (!$locale) {
            $locale = $request->getPreferredLanguage();
        }

        // 4. Validate against active database languages
        if ($locale) {
            $locale = strtolower(substr($locale, 0, 2));

            try {
                if (Schema::hasTable('languages')) {
                    $isActive = Language::where('code', $locale)
                        ->where('is_active', true)
                        ->exists();

                    if ($isActive) {
                        app()->setLocale($locale);
                        return $next($request);
                    }
                }
            } catch (\Throwable $e) {
                // Ignore DB issues
            }
        }

        // 5. Fallback to system default
        return $next($request);
    }
}
