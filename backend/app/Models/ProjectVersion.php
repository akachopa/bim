<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectVersion extends Model
{
    use HasUuids;

    protected $fillable = ['project_id', 'number', 'label', 'kind', 'document', 'created_by'];

    protected function casts(): array
    {
        return ['document' => 'array'];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
