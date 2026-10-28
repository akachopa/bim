<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SubmissionVersion extends Model
{
    use HasUuids;

    protected $fillable = ['submission_id', 'project_version_id', 'revision_number', 'document'];

    protected function casts(): array
    {
        return ['document' => 'array'];
    }
}
