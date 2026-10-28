<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProjectMember extends Model
{
    use HasUuids;

    protected $fillable = ['project_id', 'user_id', 'role'];
}
