<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BimLab extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id', 'training_program_id', 'title', 'description', 'project_template',
    ];

    protected function casts(): array
    {
        return ['project_template' => 'array'];
    }

    public function steps(): HasMany
    {
        return $this->hasMany(BimLabStep::class)->orderBy('sort_order');
    }
}
