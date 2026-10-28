<?php

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function view(User $user, Submission $submission): bool
    {
        return $user->is_super_admin
            || $submission->user_id === $user->id
            || $user->isTrainer($submission->organization_id);
    }

    public function review(User $user, Submission $submission): bool
    {
        return $user->isTrainer($submission->organization_id);
    }

    public function update(User $user, Submission $submission): bool
    {
        return $submission->user_id === $user->id
            && in_array($submission->status, ['draft', 'revision_required', 'resubmitted'], true);
    }
}
