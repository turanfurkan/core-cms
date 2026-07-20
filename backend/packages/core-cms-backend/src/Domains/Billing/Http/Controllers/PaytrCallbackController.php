<?php

namespace TuranFurkan\CoreCms\Domains\Billing\Http\Controllers;

use TuranFurkan\CoreCms\Domains\Billing\Actions\ProcessPaytrCallbackAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaytrCallbackController extends Controller
{
    /**
     * Handle incoming PayTR webhook notifications.
     */
    public function handle(Request $request, ProcessPaytrCallbackAction $action): string
    {
        Log::info('PayTR Callback: Webhook received', ['params' => $request->all()]);

        // Validate and process the callback
        $response = $action->execute($request->all());

        return $response;
    }
}
