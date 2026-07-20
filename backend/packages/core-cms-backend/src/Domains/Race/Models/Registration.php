<?php

namespace TuranFurkan\CoreCms\Domains\Race\Models;

use TuranFurkan\CoreCms\Domains\Category\Models\Category;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Registration extends Model
{
    use HasFactory;

    protected $table = 'race_registrations';

    protected $fillable = [
        'participant_id',
        'race_id',
        'user_id',
        'race_category_id',
        'bib_number',
        'price',
        'status',
        'payment_id',
        'group_id',
    ];

    protected $casts = [
        'participant_id' => 'integer',
        'race_id' => 'integer',
        'user_id' => 'integer',
        'race_category_id' => 'integer',
        'price' => 'decimal:2',
        'group_id' => 'integer',
    ];

    /**
     * Get the participant.
     */
    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }

    /**
     * Get the race.
     */
    public function race(): BelongsTo
    {
        return $this->belongsTo(Race::class);
    }

    /**
     * Get the user who paid for/booked this registration.
     */
    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the race category.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'race_category_id');
    }
}
