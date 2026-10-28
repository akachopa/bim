<?php

namespace App\Models;

use App\Models\Concerns\HasClientUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectGrid extends Model
{
    use HasClientUuids;

    protected $fillable = ['project_id', 'axis', 'label', 'position'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
