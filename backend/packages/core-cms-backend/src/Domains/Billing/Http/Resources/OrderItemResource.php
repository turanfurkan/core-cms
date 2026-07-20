<?php

namespace TuranFurkan\CoreCms\Domains\Billing\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \TuranFurkan\CoreCms\Domains\Billing\Models\OrderItem
 */
class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'orderable_type' => $this->orderable_type,
            'orderable_id' => $this->orderable_id,
            'price' => $this->price,
            'quantity' => $this->quantity,

            // Polymorphically load orderable target
            'orderable' => $this->relationLoaded('orderable') && $this->orderable
                ? ($this->orderable instanceof \TuranFurkan\CoreCms\Domains\Race\Models\Registration
                    ? new \TuranFurkan\CoreCms\Domains\Race\Http\Resources\RegistrationResource($this->orderable)
                    : $this->orderable)
                : null,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
