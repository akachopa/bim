<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AssessmentScore extends Model
{
    use HasUuids;

    protected $fillable = ['assessment_id', 'component', 'score', 'weight'];

    protected function casts(): array
    {
        return ['score' => 'float', 'weight' => 'float'];
    }
}
