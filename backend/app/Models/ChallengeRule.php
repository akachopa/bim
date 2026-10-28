<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChallengeRule extends Model
{
    use HasUuids;

    protected $fillable = ['challenge_id', 'rule_id', 'name', 'type', 'config', 'weight'];

    protected function casts(): array
    {
        return ['config' => 'array'];
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }
}
