<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCompetency extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id', 'user_id', 'competency_id', 'score', 'level',
    ];

    protected function casts(): array
    {
        return ['score' => 'float'];
    }

    public function competency(): BelongsTo
    {
        return $this->belongsTo(Competency::class);
    }
}
