<?php

namespace TuranFurkan\CoreCms\Domains\SEO\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeoPath extends Model
{
    use HasFactory;

    protected $table = 'seo_paths';

    protected $fillable = [
        'path',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_title',
        'og_description',
        'og_image_id',
        'canonical_url',
        'meta_robots',
    ];

    protected $casts = [
        'meta_title' => 'array',
        'meta_description' => 'array',
        'meta_keywords' => 'array',
        'og_title' => 'array',
        'og_description' => 'array',
        'og_image_id' => 'integer',
    ];
}
