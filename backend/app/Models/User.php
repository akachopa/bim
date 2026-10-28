<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'is_super_admin', 'current_organization_id', 'avatar_path'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable, SoftDeletes;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
        ];
    }

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_users')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function currentOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'owner_id');
    }

    public function roleIn(?string $organizationId): ?string
    {
        if (! $organizationId) {
            return null;
        }

        $pivot = $this->organizations()->where('organizations.id', $organizationId)->first();

        return $pivot?->pivot?->role;
    }

    public function hasRole(string $role, ?string $organizationId = null): bool
    {
        if ($this->is_super_admin) {
            return true;
        }

        return $this->roleIn($organizationId ?? $this->current_organization_id) === $role;
    }

    public function isTrainer(?string $organizationId = null): bool
    {
        return $this->is_super_admin
            || in_array($this->roleIn($organizationId ?? $this->current_organization_id), [
                Role::Trainer->value,
                Role::OrgAdmin->value,
            ], true);
    }

    public function toAuthArray(): array
    {
        $orgId = $this->current_organization_id;
        $role = $this->is_super_admin ? Role::SuperAdmin->value : $this->roleIn($orgId);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_super_admin' => $this->is_super_admin,
            'current_organization_id' => $orgId,
            'role' => $role,
            'organizations' => $this->organizations->map(fn (Organization $org) => [
                'id' => $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
                'code' => $org->code,
                'role' => $org->pivot->role,
            ])->values(),
        ];
    }
}
