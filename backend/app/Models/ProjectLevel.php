<?php

namespace App\Models;

use App\Models\Concerns\HasClientUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectLevel extends Model
{
    use HasClientUuids;

    protected $fillable = ['project_id', 'name', 'elevation', 'sort_order'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
