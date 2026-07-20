<?php

namespace TuranFurkan\CoreCms\Domains\Billing\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $table = 'order_items';

    protected $fillable = [
        'order_id',
        'orderable_type',
        'orderable_id',
        'price',
        'quantity',
    ];

    protected $casts = [
        'order_id' => 'integer',
        'orderable_id' => 'integer',
        'price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the parent orderable model (Registration, AccommodationBooking, etc.).
     */
    public function orderable(): MorphTo
    {
        return $this->morphTo();
    }
}
