<?php

namespace App\Domains\Race\Models;

use App\Domains\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Participant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'gender',
        'date_of_birth',
        'identity_number',
        'blood_type',
        'phone_number',
        't_shirt_size',
        'club_name',
        'nationality',
        'emergency_contact',
        'emergency_phone_number',
        'address',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'user_id' => 'integer',
    ];

    /**
     * Get the user who owns this participant profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all registrations associated with this participant.
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * Get all races this participant has registered for.
     */
    public function races(): BelongsToMany
    {
        return $this->belongsToMany(Race::class, 'race_registrations')
            ->withPivot([
                'id',
                'race_category_id',
                'bib_number',
                'price',
                'status',
                'payment_id',
                'group_id',
                'user_id',
            ])
            ->withTimestamps();
    }
}
