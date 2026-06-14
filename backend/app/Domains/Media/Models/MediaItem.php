<?php

namespace App\Domains\Media\Models;

use Spatie\MediaLibrary\MediaCollections\Models\Media as SpatieMedia;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaItem extends SpatieMedia
{
    protected $table = 'media';

    // Extend fillable fields to include folder_id
    protected $fillable = [
        'folder_id',
        'name',
        'file_name',
        'mime_type',
        'disk',
        'conversions_disk',
        'size',
        'manipulations',
        'custom_properties',
        'generated_conversions',
        'responsive_images',
        'order_column',
    ];

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }

    public function getAltText(): ?string
    {
        return $this->getCustomProperty('alt_text');
    }

    public function getTitle(): ?string
    {
        return $this->getCustomProperty('title');
    }

    public function getDescription(): ?string
    {
        return $this->getCustomProperty('description');
    }

    public function getCaption(): ?string
    {
        return $this->getCustomProperty('caption');
    }
}
