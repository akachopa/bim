<?php

namespace App\Policies;

use App\Models\TrainingProgram;
use App\Models\User;

class TrainingProgramPolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user->current_organization_id || $user->is_super_admin;
    }

    public function view(User $user, TrainingProgram $program): bool
    {
        return $user->is_super_admin
            || $user->organizations()->where('organizations.id', $program->organization_id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->is_super_admin || $user->isTrainer();
    }

    public function update(User $user, TrainingProgram $program): bool
    {
        return $this->view($user, $program) && $user->isTrainer($program->organization_id);
    }
}
