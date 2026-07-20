<?php

namespace TuranFurkan\CoreCms\Domains\Media\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaLibraryPlaceholder extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $table = 'media_library_placeholders';

    protected $fillable = [
        'name',
    ];

    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('webp')
            ->format('webp')
            ->nonQueued();
    }
}
