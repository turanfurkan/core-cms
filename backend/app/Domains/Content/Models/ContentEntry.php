<?php

namespace App\Domains\Content\Models;

use App\Domains\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Domains\SEO\Traits\HasSeo;

class ContentEntry extends Model
{
    use HasFactory, SoftDeletes, HasSeo;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'content_type_id',
        'data',
        'status',
        'created_by',
        'updated_by',
        'published_at',
    ];

    protected $casts = [
        'data' => 'array',
        'published_at' => 'datetime',
    ];

    public function contentType(): BelongsTo
    {
        return $this->belongsTo(ContentType::class);
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(ContentRevision::class)->orderBy('version', 'desc');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getLocalizedValue(string $field, ?string $locale = null): mixed
    {
        $locale = $locale ?: app()->getLocale();
        $value = $this->data[$field] ?? null;

        if (is_array($value)) {
            return $value[$locale] ?? $value[config('app.fallback_locale')] ?? reset($value) ?? null;
        }

        return $value;
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }
}
