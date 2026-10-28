<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Competency extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'slug', 'description', 'mvp_focus'];

    protected function casts(): array
    {
        return ['mvp_focus' => 'boolean'];
    }

    public function users(): HasMany
    {
        return $this->hasMany(UserCompetency::class);
    }
}
