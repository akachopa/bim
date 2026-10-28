<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectMaterial extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'organization_id', 'project_id', 'name', 'code', 'color', 'opacity', 'is_global',
    ];

    protected function casts(): array
    {
        return ['opacity' => 'float', 'is_global' => 'boolean'];
    }
}
