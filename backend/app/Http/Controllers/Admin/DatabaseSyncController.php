<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class DatabaseSyncController extends Controller
{
    /**
     * Run database synchronization commands.
     */
    public function sync(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'string', 'in:identity,race_billing'],
            'dry_run' => ['boolean'],
            'skip_media' => ['boolean'],
        ]);

        $type = $request->input('type');
        $dryRun = $request->boolean('dry_run', false);
        $skipMedia = $request->boolean('skip_media', true);

        // Prevent concurrent sync executions using atomic lock
        $lockKey = 'database-sync-' . $type;
        $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 600); // 10-minute lock max

        if (!$lock->get()) {
            return response()->json([
                'success' => false,
                'message' => 'Senkronizasyon işlemi şu anda zaten çalışıyor. Lütfen mevcut işlemin bitmesini bekleyin.',
                'output' => 'Sync already in progress.',
            ], 429);
        }

        // Allow execution to run for up to 10 minutes
        set_time_limit(600);

        try {
            if ($type === 'identity') {
                $parameters = [];
                if ($dryRun) {
                    $parameters['--dry-run'] = true;
                }
                
                Artisan::call('app:migrate-identity-data', $parameters);
                $output = Artisan::output();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Identity database synchronization completed.',
                    'output' => $output,
                ]);
            } else {
                // race_billing
                $parameters = [];
                if ($skipMedia) {
                    $parameters['--skip-media'] = true;
                }

                Artisan::call('app:migrate-race-and-billing-data', $parameters);
                $output = Artisan::output();

                return response()->json([
                    'success' => true,
                    'message' => 'Race and billing database synchronization completed.',
                    'output' => $output,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Database sync failed: ' . $e->getMessage(), [
                'exception' => $e,
                'type' => $type,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Database synchronization failed: ' . $e->getMessage(),
                'output' => $e->getMessage() . "\n" . $e->getTraceAsString(),
            ], 500);
        } finally {
            $lock->release();
        }
    }
}
