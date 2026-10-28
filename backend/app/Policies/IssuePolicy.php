<?php

namespace App\Policies;

use App\Models\Issue;
use App\Models\User;

class IssuePolicy
{
    public function view(User $user, Issue $issue): bool
    {
        return $user->is_super_admin
            || $user->organizations()->where('organizations.id', $issue->organization_id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->isTrainer();
    }

    public function update(User $user, Issue $issue): bool
    {
        return $this->view($user, $issue);
    }
}
