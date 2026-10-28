<?php

namespace App\Models;

use App\Models\Concerns\HasClientUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectElement extends Model
{
    use HasClientUuids, SoftDeletes;

    protected $fillable = [
        'project_id', 'level_id', 'parent_id', 'type', 'name', 'code', 'ifc_class',
        'geometry', 'transform', 'properties', 'metadata', 'material_id', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'geometry' => 'array',
            'transform' => 'array',
            'properties' => 'array',
            'metadata' => 'array',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
