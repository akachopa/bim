<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use BelongsToOrganization, HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id', 'owner_id', 'training_program_id', 'challenge_id', 'bim_lab_id',
        'title', 'code', 'description', 'status', 'unit', 'schema_version', 'settings',
        'document', 'last_saved_at',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'document' => 'array',
            'last_saved_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    public function lab(): BelongsTo
    {
        return $this->belongsTo(BimLab::class, 'bim_lab_id');
    }

    public function levels(): HasMany
    {
        return $this->hasMany(ProjectLevel::class)->orderBy('sort_order');
    }

    public function grids(): HasMany
    {
        return $this->hasMany(ProjectGrid::class);
    }

    public function elements(): HasMany
    {
        return $this->hasMany(ProjectElement::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ProjectVersion::class)->orderByDesc('number');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function issues(): HasMany
    {
        return $this->hasMany(Issue::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }
}
