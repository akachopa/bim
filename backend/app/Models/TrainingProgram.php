<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainingProgram extends Model
{
    use BelongsToOrganization, HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id', 'title', 'code', 'description', 'status', 'duration_hours',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class)->orderBy('sort_order');
    }

    public function classes(): HasMany
    {
        return $this->hasMany(TrainingClass::class);
    }
}
