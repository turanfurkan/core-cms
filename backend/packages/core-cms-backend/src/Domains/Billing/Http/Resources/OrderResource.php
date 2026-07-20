<?php

namespace TuranFurkan\CoreCms\Domains\Billing\Http\Resources;

use TuranFurkan\CoreCms\Domains\Identity\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \TuranFurkan\CoreCms\Domains\Billing\Models\Order
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'gateway' => $this->gateway,
            'transaction_id' => $this->transaction_id,

            // Loaded relations
            'user' => $this->relationLoaded('user') && $this->user
                ? new UserResource($this->user)
                : null,
            'items' => $this->relationLoaded('items') && $this->items
                ? OrderItemResource::collection($this->items)
                : [],
            'transactions' => $this->relationLoaded('transactions') && $this->transactions
                ? $this->transactions // return raw collections or wrap in resource
                : [],

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
