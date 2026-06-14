<?php

namespace App\Domains\Content\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_collection',
    ];

    protected $casts = [
        'is_collection' => 'boolean',
    ];

    public function fields(): HasMany
    {
        return $this->hasMany(ContentField::class)->orderBy('order', 'asc');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(ContentEntry::class);
    }
}
