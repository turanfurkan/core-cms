<?php

namespace TuranFurkan\CoreCms\Domains\Post\Models;

use TuranFurkan\CoreCms\Domains\Category\Models\Category;
use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaItem;
use TuranFurkan\CoreCms\Domains\SEO\Traits\HasSeo;
use TuranFurkan\CoreCms\Domains\Workflow\Traits\HasWorkflow;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory, SoftDeletes, HasSeo, HasWorkflow;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'title',
        'slug',
        'content',
        'summary',
        'cover_image_id',
        'reading_time',
        'publish_date',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'title' => 'array',
        'slug' => 'array',
        'content' => 'array',
        'summary' => 'array',
        'cover_image_id' => 'integer',
        'reading_time' => 'integer',
        'publish_date' => 'datetime',
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
     * Cover image relation.
     */
    public function coverImage(): BelongsTo
    {
        return $this->belongsTo(MediaItem::class, 'cover_image_id');
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
    public function getLocalizedTitle(string $locale = 'tr'): string
    {
        return $this->title[$locale] ?? $this->title['tr'] ?? $this->title['en'] ?? '';
    }

    public function getLocalizedSlug(string $locale = 'tr'): string
    {
        return $this->slug[$locale] ?? $this->slug['tr'] ?? $this->slug['en'] ?? '';
    }

    public function getLocalizedContent(string $locale = 'tr'): string
    {
        return $this->content[$locale] ?? $this->content['tr'] ?? $this->content['en'] ?? '';
    }

    public function getLocalizedSummary(string $locale = 'tr'): string
    {
        return $this->summary[$locale] ?? $this->summary['tr'] ?? $this->summary['en'] ?? '';
    }

    /**
     * Scope for published posts.
     */
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED)
            ->where(function ($q) {
                $q->whereNull('publish_date')
                  ->orWhere('publish_date', '<=', now());
            });
    }
}
