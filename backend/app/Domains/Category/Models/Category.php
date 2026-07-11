<?php

namespace App\Domains\Category\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use App\Domains\Race\Models\Race;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_id',
        'parent_id',
        'type',
        'order',
        'is_active',
        'field_settings',
        'tabs',
    ];

    protected $casts = [
        'name' => 'array',
        'slug' => 'array',
        'description' => 'array',
        'field_settings' => 'array',
        'tabs' => 'array',
        'is_active' => 'boolean',
        'order' => 'integer',
        'parent_id' => 'integer',
        'image_id' => 'integer',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('order', 'asc');
    }

    public function races(): MorphToMany
    {
        return $this->morphedByMany(Race::class, 'categorizable');
    }

    public function posts(): MorphToMany
    {
        return $this->morphedByMany(\App\Domains\Post\Models\Post::class, 'categorizable');
    }

    public function partners(): MorphToMany
    {
        return $this->morphedByMany(\App\Domains\Partner\Models\Partner::class, 'categorizable')->orderBy('order', 'asc');
    }

    public function coverImage(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\Media\Models\MediaItem::class, 'image_id');
    }

    public function getLocalizedName(string $locale = 'tr'): string
    {
        return $this->name[$locale] ?? $this->name['tr'] ?? '';
    }
}
