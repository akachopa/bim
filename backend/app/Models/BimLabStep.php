<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BimLabStep extends Model
{
    use HasUuids;

    protected $fillable = [
        'bim_lab_id', 'title', 'instruction', 'required_action', 'validation_rule', 'hint', 'sort_order',
    ];

    protected function casts(): array
    {
        return ['validation_rule' => 'array'];
    }

    public function lab(): BelongsTo
    {
        return $this->belongsTo(BimLab::class, 'bim_lab_id');
    }
}
