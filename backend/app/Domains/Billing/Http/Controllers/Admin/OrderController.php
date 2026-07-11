<?php

namespace App\Domains\Billing\Http\Controllers\Admin;

use App\Domains\Billing\Http\Resources\OrderResource;
use App\Domains\Billing\Models\Order;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::query()->with(['user', 'items.orderable', 'transactions']);

        if ($request->has('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('gateway') && $request->query('gateway') !== 'all') {
            $query->where('gateway', $request->query('gateway'));
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $orders = $query->orderBy('id', 'desc')
            ->paginate($request->query('per_page', 15));

        return OrderResource::collection($orders);
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['user', 'items.orderable', 'transactions']));
    }

    public function update(Request $request, Order $order): OrderResource
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,paid,failed,refunded',
        ]);

        DB::transaction(function () use ($order, $validated) {
            $order->update($validated);

            // If order status is updated to 'paid', update its orderable items as well
            if ($validated['status'] === 'paid') {
                foreach ($order->items as $item) {
                    $orderable = $item->orderable;
                    if ($orderable) {
                        if (method_exists($orderable, 'update') || isset($orderable->status)) {
                            $orderable->update([
                                'status' => 'paid',
                                'payment_id' => $order->transaction_id,
                            ]);
                        }
                    }
                }
            }
        });

        return new OrderResource($order->load(['user', 'items.orderable', 'transactions']));
    }

    public function destroy(Order $order): JsonResponse
    {
        $order->delete();
        return response()->json(['message' => 'Order deleted successfully.']);
    }
}
