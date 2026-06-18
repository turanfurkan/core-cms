<?php

namespace App\Domains\API\Http\Middleware;

use App\Domains\API\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiKey
{
    public function handle(Request $request, Closure $next, ...$scopes): Response
    {
        if (!config('api.keys_enabled', true)) {
            return $next($request);
        }

        $key = $request->header('X-API-Key');
        if (!$key && $request->bearerToken()) {
            $key = $request->bearerToken();
        }

        if (empty($key)) {
            return response()->json([
                'error_code' => 'API.UNAUTHORIZED',
                'message' => 'API key is missing. Please provide the X-API-Key header or a Bearer token.',
            ], 401);
        }

        $hashedKey = hash('sha256', $key);
        $apiKey = ApiKey::where('hashed_key', $hashedKey)->first();

        if (!$apiKey) {
            return response()->json([
                'error_code' => 'API.INVALID_KEY',
                'message' => 'Invalid API key provided.',
            ], 401);
        }

        if (!$apiKey->is_active) {
            return response()->json([
                'error_code' => 'API.KEY_INACTIVE',
                'message' => 'The provided API key is inactive.',
            ], 401);
        }

        if ($apiKey->isExpired()) {
            return response()->json([
                'error_code' => 'API.KEY_EXPIRED',
                'message' => 'The provided API key has expired.',
            ], 401);
        }

        if (!empty($scopes)) {
            $hasAccess = false;
            foreach ($scopes as $scope) {
                if ($apiKey->hasScope($scope)) {
                    $hasAccess = true;
                    break;
                }
            }

            if (!$hasAccess) {
                return response()->json([
                    'error_code' => 'API.FORBIDDEN',
                    'message' => 'Forbidden. The API key lacks the required scope: ' . implode(' or ', $scopes),
                ], 403);
            }
        }

        $apiKey->update(['last_used_at' => now()]);

        $request->attributes->set('api_key', $apiKey);

        return $next($request);
    }
}
