<?php

namespace TuranFurkan\CoreCms\Domains\Race\Models;

use TuranFurkan\CoreCms\Domains\Category\Models\Category;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Race extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'start_date',
        'start_time',
        'location_embed',
        'price',
        'discounted_price',
        'registration_deadline',
        'max_participants',
        'distance',
        'start_point',
        'finish_point',
        'elevation',
        'descent',
        'cover_image_id',
        'graphic_image_id',
        'gpx_file_id',
        'strava_file_id',
        'gallery_ids',
        'youtube_embed',
        'is_multi_race',
        'manager_name',
        'manager_phone',
        'is_sales_active',
        'contest_id',
        'is_free',
        'order',
        'status',
        'tabs',
        'min_age',
        'max_age',
        'whats_included',
    ];

    protected $casts = [
        'title' => 'array',
        'slug' => 'array',
        'content' => 'array',
        'gallery_ids' => 'array',
        'is_multi_race' => 'boolean',
        'is_sales_active' => 'boolean',
        'is_free' => 'boolean',
        'price' => 'decimal:2',
        'discounted_price' => 'decimal:2',
        'max_participants' => 'integer',
        'order' => 'integer',
        'cover_image_id' => 'integer',
        'graphic_image_id' => 'integer',
        'gpx_file_id' => 'integer',
        'strava_file_id' => 'integer',
        'contest_id' => 'integer',
        'tabs' => 'array',
        'min_age' => 'integer',
        'max_age' => 'integer',
        'whats_included' => 'array',
    ];

    // Polymorphic categories relation
    public function categories(): BelongsToMany
    {
        return $this->morphToMany(Category::class, 'categorizable');
    }

    // Child races belonging to this parent multi-race
    public function childRaces(): BelongsToMany
    {
        return $this->belongsToMany(Race::class, 'race_relations', 'parent_id', 'child_id')
            ->orderBy('order', 'asc');
    }

    // Parent races that this race is child of
    public function parentRaces(): BelongsToMany
    {
        return $this->belongsToMany(Race::class, 'race_relations', 'child_id', 'parent_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(Participant::class, 'race_registrations')
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

    public function coverImage(): BelongsTo
    {
        return $this->belongsTo(\TuranFurkan\CoreCms\Domains\Media\Models\MediaItem::class, 'cover_image_id');
    }

    public function graphicImage(): BelongsTo
    {
        return $this->belongsTo(\TuranFurkan\CoreCms\Domains\Media\Models\MediaItem::class, 'graphic_image_id');
    }

    public function gpxFile(): BelongsTo
    {
        return $this->belongsTo(\TuranFurkan\CoreCms\Domains\Media\Models\MediaItem::class, 'gpx_file_id');
    }

    public function stravaFile(): BelongsTo
    {
        return $this->belongsTo(\TuranFurkan\CoreCms\Domains\Media\Models\MediaItem::class, 'strava_file_id');
    }

    public function getLocalizedTitle(string $locale = 'tr'): string
    {
        return $this->title[$locale] ?? $this->title['tr'] ?? '';
    }

    public function getLocalizedContent(string $locale = 'tr'): string
    {
        return $this->content[$locale] ?? $this->content['tr'] ?? '';
    }
}
