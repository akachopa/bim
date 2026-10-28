<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Submission extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id', 'project_id', 'user_id', 'assignment_id', 'project_version_id',
        'status', 'auto_score', 'trainer_score', 'final_score', 'score_breakdown',
        'trainer_comment', 'reviewed_by', 'submitted_at', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'score_breakdown' => 'array',
            'auto_score' => 'float',
            'trainer_score' => 'float',
            'final_score' => 'float',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(SubmissionVersion::class);
    }

    public function assessment(): HasOne
    {
        return $this->hasOne(Assessment::class);
    }
}
