<?php

use App\Domains\Identity\Exceptions\LoginException;
use App\Domains\Identity\Exceptions\OtpException;
use App\Domains\Identity\Exceptions\RegistrationException;
use App\Domains\Identity\Exceptions\RevokeFailedException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (RegistrationException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'error_code' => $e->errorCode,
                'message' => $e->getMessage(),
                'errors' => $e->errors,
            ], $e->statusCode);
        });

        $exceptions->render(function (LoginException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            $headers = [];
            if ($e->retryAfter !== null) {
                $headers['Retry-After'] = (string) $e->retryAfter;
            }

            return response()->json([
                'error_code' => $e->errorCode,
                'message' => $e->getMessage(),
                'errors' => $e->errors,
                'retry_after' => $e->retryAfter,
            ], $e->statusCode, $headers);
        });

        $exceptions->render(function (OtpException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            $headers = [];
            if ($e->retryAfter !== null) {
                $headers['Retry-After'] = (string) $e->retryAfter;
            }

            return response()->json([
                'error_code' => $e->errorCode,
                'message' => $e->getMessage(),
                'errors' => $e->errors,
                'retry_after' => $e->retryAfter,
            ], $e->statusCode, $headers);
        });

        $exceptions->render(function (RevokeFailedException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'error_code' => $e->errorCode,
                'message' => $e->getMessage(),
            ], $e->statusCode);
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'error_code' => 'USER.VALIDATION_ERROR',
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], $e->status);
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'error_code' => 'AUTH.FORBIDDEN',
                'message' => $e->getMessage() ?: 'You do not have permission for this action.',
            ], 403);
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'error_code' => 'AUTH.FORBIDDEN',
                'message' => $e->getMessage() ?: 'You do not have permission for this action.',
            ], 403);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'error_code' => 'AUTH.UNAUTHORIZED',
                'message' => $e->getMessage() ?: 'Authentication required.',
            ], 401);
        });
    })->create();
