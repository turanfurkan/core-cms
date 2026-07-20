<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketingPromotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'content',
        'rules',
        'is_active',
    ];

    protected $casts = [
        'content' => 'array',
        'rules' => 'array',
        'is_active' => 'boolean',
    ];
}
