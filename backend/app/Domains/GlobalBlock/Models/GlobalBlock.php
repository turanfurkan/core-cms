<?php

namespace App\Domains\GlobalBlock\Models;

use App\Domains\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GlobalBlock extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'global_blocks';

    protected $fillable = [
        'name',
        'type',
        'content',
        'styles',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'content' => 'array',
        'styles' => 'array',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
