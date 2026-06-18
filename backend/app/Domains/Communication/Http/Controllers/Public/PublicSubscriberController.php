<?php

namespace App\Domains\Communication\Http\Controllers\Public;

use App\Domains\Communication\Actions\SubscribeAction;
use App\Domains\Communication\Actions\UnsubscribeAction;
use App\Domains\Communication\DTOs\SubscriberData;
use App\Domains\Communication\Http\Requests\SubscriberRequest;
use App\Domains\Communication\Http\Resources\SubscriberResource;
use App\Domains\Communication\Models\Subscriber;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicSubscriberController extends Controller
{
    public function subscribe(SubscriberRequest $request, SubscribeAction $action): SubscriberResource
    {
        $dto = SubscriberData::fromRequest($request);
        $subscriber = $action->execute($dto);

        return new SubscriberResource($subscriber);
    }

    public function unsubscribe(Request $request, Subscriber $subscriber, UnsubscribeAction $action): JsonResponse
    {
        if (!$request->hasValidSignature()) {
            return response()->json([
                'error_code' => 'COMMUNICATION.INVALID_SIGNATURE',
                'message' => 'The unsubscribe link is invalid or has expired.',
            ], 401);
        }

        $action->execute($subscriber);

        return response()->json([
            'message' => 'You have been successfully unsubscribed from our newsletter.',
        ]);
    }
}
