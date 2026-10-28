<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id', 'user_id', 'action', 'auditable_type', 'auditable_id', 'payload', 'ip_address',
    ];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }
}
