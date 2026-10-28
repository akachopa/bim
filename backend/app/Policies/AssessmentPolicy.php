<?php

namespace App\Policies;

use App\Models\Assessment;
use App\Models\User;

class AssessmentPolicy
{
    public function view(User $user, Assessment $assessment): bool
    {
        return $user->is_super_admin
            || $assessment->user_id === $user->id
            || $user->isTrainer($assessment->organization_id);
    }

    public function update(User $user, Assessment $assessment): bool
    {
        return $user->isTrainer($assessment->organization_id);
    }
}
