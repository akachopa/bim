<?php

namespace App\Models\Concerns;

use App\Support\Tenant;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToOrganization
{
    protected static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $query): void {
            $orgId = app(Tenant::class)->id();
            if ($orgId) {
                $query->where($query->getModel()->getTable().'.organization_id', $orgId);
            }
        });

        static::creating(function ($model): void {
            if (empty($model->organization_id)) {
                $model->organization_id = app(Tenant::class)->id();
            }
        });
    }
}
