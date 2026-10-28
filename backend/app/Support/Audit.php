<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class Audit
{
    public static function record(string $action, ?Model $auditable = null, array $payload = [], ?User $user = null): void
    {
        $user ??= auth()->user();

        AuditLog::query()->create([
            'organization_id' => app(Tenant::class)->id() ?? $user?->current_organization_id,
            'user_id' => $user?->id,
            'action' => $action,
            'auditable_type' => $auditable ? $auditable::class : null,
            'auditable_id' => $auditable?->getKey(),
            'payload' => $payload,
            'ip_address' => Request::ip(),
        ]);
    }
}
