<?php

namespace App\Domains\Billing\Models;

use App\Domains\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'orderable_type',
        'orderable_id',
        'amount',
        'currency',
        'status',
        'gateway',
        'transaction_id',
    ];

    protected static function booted()
    {
        static::saved(function ($order) {
            if ($order->isDirty('status') && $order->status === 'paid') {
                if ($order->orderable && method_exists($order->orderable, 'contentType')) {
                    $contentType = $order->orderable->contentType;
                    if ($contentType) {
                        \App\Domains\Content\Support\ContentCacheHelper::invalidate($contentType->slug);
                    }
                }
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orderable(): MorphTo
    {
        return $this->morphTo();
    }
}
