<?php

namespace TuranFurkan\CoreCms\Domains\Billing\Actions;

use TuranFurkan\CoreCms\Domains\Billing\Models\Order;
use Illuminate\Support\Facades\DB;

class CreateOrderAction
{
    /**
     * Create an order and its items in a transaction.
     *
     * @param array $data {
     *   user_id: int,
     *   amount: float,
     *   currency?: string,
     *   gateway?: string,
     *   items: array<array{
     *     orderable_type: string,
     *     orderable_id: int,
     *     price: float,
     *     quantity?: int
     *   }>
     * }
     */
    public function execute(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            // 1. Create the Order
            $order = Order::create([
                'user_id' => $data['user_id'],
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? 'TRY',
                'gateway' => $data['gateway'] ?? null,
                'status' => 'pending',
            ]);

            // 2. Create the Order Items
            foreach ($data['items'] as $item) {
                $order->items()->create([
                    'orderable_type' => $item['orderable_type'],
                    'orderable_id' => $item['orderable_id'],
                    'price' => $item['price'],
                    'quantity' => $item['quantity'] ?? 1,
                ]);
            }

            return $order->load('items');
        });
    }
}
