<?php

namespace App\Policies;

use App\Models\Certificate;
use App\Models\User;

class CertificatePolicy
{
    public function view(User $user, Certificate $certificate): bool
    {
        return $user->is_super_admin
            || $certificate->user_id === $user->id
            || $user->isTrainer($certificate->organization_id);
    }

    public function create(User $user): bool
    {
        return $user->isTrainer();
    }
}
