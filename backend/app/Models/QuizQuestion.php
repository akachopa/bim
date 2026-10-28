<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestion extends Model
{
    use HasUuids;

    protected $fillable = ['quiz_id', 'prompt', 'options', 'correct_index', 'sort_order'];

    protected function casts(): array
    {
        return ['options' => 'array', 'correct_index' => 'integer'];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }
}
