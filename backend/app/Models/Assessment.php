<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assessment extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id', 'submission_id', 'user_id', 'completion', 'accuracy',
        'compliance', 'discipline', 'final_score', 'manual_adjustment', 'adjustment_reason', 'adjusted_by',
    ];

    protected function casts(): array
    {
        return [
            'completion' => 'float',
            'accuracy' => 'float',
            'compliance' => 'float',
            'discipline' => 'float',
            'final_score' => 'float',
            'manual_adjustment' => 'float',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function scores(): HasMany
    {
        return $this->hasMany(AssessmentScore::class);
    }
}
