<?php

namespace TuranFurkan\CoreCms\Domains\Communication\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Communication\Http\Requests\SubscriberRequest;
use TuranFurkan\CoreCms\Domains\Communication\Http\Resources\SubscriberResource;
use TuranFurkan\CoreCms\Domains\Communication\Models\Subscriber;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SubscriberController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Subscriber::query();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $query->where('email', 'like', '%' . $request->input('search') . '%');
        }

        $subscribers = $query->orderBy('id', 'desc')->paginate($request->input('limit', 15));

        return SubscriberResource::collection($subscribers);
    }

    public function store(SubscriberRequest $request): SubscriberResource
    {
        $subscriber = Subscriber::create($request->validated());

        return new SubscriberResource($subscriber);
    }

    public function show(Subscriber $subscriber): SubscriberResource
    {
        return new SubscriberResource($subscriber);
    }

    public function update(Subscriber $subscriber, SubscriberRequest $request): SubscriberResource
    {
        $subscriber->update($request->validated());

        return new SubscriberResource($subscriber);
    }

    public function destroy(Subscriber $subscriber): JsonResponse
    {
        $subscriber->delete();

        return response()->json([
            'message' => 'Subscriber deleted successfully.',
        ]);
    }
}
