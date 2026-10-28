<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_super_admin || (bool) $user->current_organization_id;
    }

    public function view(User $user, Project $project): bool
    {
        return $this->sameOrg($user, $project);
    }

    public function create(User $user): bool
    {
        return $user->is_super_admin || (bool) $user->current_organization_id;
    }

    public function update(User $user, Project $project): bool
    {
        if (! $this->sameOrg($user, $project)) {
            return false;
        }

        return $project->owner_id === $user->id || $user->isTrainer($project->organization_id);
    }

    public function delete(User $user, Project $project): bool
    {
        if (! $this->sameOrg($user, $project)) {
            return false;
        }

        return $project->owner_id === $user->id || $user->hasRole('org_admin', $project->organization_id);
    }

    public function review(User $user, Project $project): bool
    {
        return $this->sameOrg($user, $project) && $user->isTrainer($project->organization_id);
    }

    private function sameOrg(User $user, Project $project): bool
    {
        return $user->is_super_admin
            || $user->organizations()->where('organizations.id', $project->organization_id)->exists();
    }
}
