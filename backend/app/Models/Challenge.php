<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Challenge extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id', 'title', 'description', 'difficulty', 'duration_minutes',
        'maximum_score', 'passing_score', 'project_template',
    ];

    protected function casts(): array
    {
        return ['project_template' => 'array'];
    }

    public function rules(): HasMany
    {
        return $this->hasMany(ChallengeRule::class);
    }
}
