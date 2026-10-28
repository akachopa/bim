<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Models\Project;
use App\Support\Audit;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IssueController extends Controller
{
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json(['data' => $project->issues()->with(['creator:id,name', 'comments.user:id,name'])->latest()->get()]);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('review', $project);
        $data = $request->validate([
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'severity' => ['required', 'in:info,minor,major,critical'],
            'element_id' => ['nullable', 'string'],
            'submission_id' => ['nullable', 'uuid'],
            'assigned_to' => ['nullable', 'uuid'],
            'camera_state' => ['nullable', 'array'],
        ]);
        $issue = $project->issues()->create([
            ...$data,
            'organization_id' => app(Tenant::class)->requireId(),
            'created_by' => $request->user()->id,
            'status' => 'open',
        ]);
        Audit::record('issue.created', $issue, $data, $request->user());

        return response()->json(['data' => $issue], 201);
    }

    public function update(Request $request, Issue $issue): JsonResponse
    {
        $this->authorize('update', $issue);
        $data = $request->validate([
            'status' => ['sometimes', 'in:open,in_progress,resolved,closed'],
            'severity' => ['sometimes', 'in:info,minor,major,critical'],
            'title' => ['sometimes', 'string'],
            'description' => ['nullable', 'string'],
        ]);
        if (($data['status'] ?? null) === 'resolved') {
            $data['resolved_at'] = now();
        }
        $issue->update($data);
        Audit::record('issue.changed', $issue, $data, $request->user());

        return response()->json(['data' => $issue]);
    }

    public function comment(Request $request, Issue $issue): JsonResponse
    {
        $this->authorize('view', $issue);
        $data = $request->validate(['body' => ['required', 'string']]);
        $comment = $issue->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        return response()->json(['data' => $comment->load('user:id,name')], 201);
    }
}
