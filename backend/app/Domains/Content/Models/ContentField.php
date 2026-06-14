<?php

namespace App\Domains\Content\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentField extends Model
{
    use HasFactory;

    protected $fillable = [
        'content_type_id',
        'name',
        'slug',
        'type',
        'validation_rules',
        'options',
        'order',
    ];

    protected $casts = [
        'validation_rules' => 'array',
        'options' => 'array',
        'order' => 'integer',
    ];

    public function contentType(): BelongsTo
    {
        return $this->belongsTo(ContentType::class);
    }
}
