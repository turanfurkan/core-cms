<?php

namespace TuranFurkan\CoreCms\Domains\Page\Models;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaItem;
use TuranFurkan\CoreCms\Domains\SEO\Traits\HasSeo;
use TuranFurkan\CoreCms\Domains\Workflow\Traits\HasWorkflow;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
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
        'layout',
        'status',
        'is_system',
        'is_homepage',
        'parent_id',
        'order',
        'cover_image_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'title' => 'array',
        'slug' => 'array',
        'content' => 'array',
        'summary' => 'array',
        'is_system' => 'boolean',
        'is_homepage' => 'boolean',
        'order' => 'integer',
        'parent_id' => 'integer',
        'cover_image_id' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saving(function (Page $page) {
            if ($page->is_homepage) {
                static::where('id', '!=', $page->id)
                    ->where('is_homepage', true)
                    ->update(['is_homepage' => false]);
            }
        });
    }

    /**
     * Parent page relation.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    /**
     * Child pages relation.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_id')->orderBy('order', 'asc');
    }

    /**
     * Cover image relation.
     */
    public function coverImage(): BelongsTo
    {
        return $this->belongsTo(MediaItem::class, 'cover_image_id');
    }

    /**
     * Creator relation.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Updater relation.
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
     * Scope for published pages.
     */
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }
}
