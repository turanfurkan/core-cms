<?php

namespace TuranFurkan\CoreCms\Domains\Partner\Models;

use TuranFurkan\CoreCms\Domains\Category\Models\Category;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaItem;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Partner extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'name',
        'logo_id',
        'link',
        'status',
        'order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'name' => 'array',
        'logo_id' => 'integer',
        'order' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

    /**
     * Polymorphic categories relation.
     */
    public function categories(): BelongsToMany
    {
        return $this->morphToMany(Category::class, 'categorizable');
    }

    /**
     * Logo image relation.
     */
    public function logo(): BelongsTo
    {
        return $this->belongsTo(MediaItem::class, 'logo_id');
    }

    /**
     * Author relation.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Last editor relation.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Localized attribute helper getters.
     */
    public function getLocalizedName(string $locale = 'tr'): string
    {
        return $this->name[$locale] ?? $this->name['tr'] ?? $this->name['en'] ?? '';
    }
}
