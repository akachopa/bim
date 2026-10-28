<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class IfcJob extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id', 'project_id', 'type', 'status', 'result', 'error',
    ];

    protected function casts(): array
    {
        return ['result' => 'array'];
    }
}
