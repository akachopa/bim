<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Submission;
use App\Services\AssessmentService;
use App\Services\ProjectDocumentService;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function __construct(
        private AssessmentService $assessments,
        private ProjectDocumentService $documents,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Submission::query()->with(['project:id,title,code', 'user:id,name,email'])->latest();
        if (! $request->user()->isTrainer()) {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json(['data' => $query->paginate(20)]);
    }

    public function submit(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $version = $this->documents->snapshot($project, $request->user(), 'Submission', 'submission');

        $submission = Submission::query()->firstOrNew([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
        ]);
        $isRevision = in_array($submission->status, ['revision_required'], true);
        $submission->fill([
            'organization_id' => $project->organization_id,
            'project_version_id' => $version->id,
            'status' => $isRevision ? 'resubmitted' : 'submitted',
            'submitted_at' => now(),
        ]);
        $submission->save();

        $submission->versions()->create([
            'project_version_id' => $version->id,
            'revision_number' => $submission->versions()->count() + 1,
            'document' => $project->document,
        ]);

        $project->update(['status' => 'submitted']);
        $assessment = $this->assessments->evaluateSubmission($submission->fresh(), $request->user());
        Audit::record('submission.created', $submission, ['status' => $submission->status], $request->user());

        return response()->json([
            'data' => $submission->fresh(['assessment', 'project']),
            'assessment' => $assessment,
        ], 201);
    }

    public function show(Submission $submission): JsonResponse
    {
        $this->authorize('view', $submission);
        $submission->load(['project', 'user:id,name,email', 'assessment.scores', 'versions']);

        return response()->json(['data' => $submission]);
    }

    public function review(Request $request, Submission $submission): JsonResponse
    {
        $this->authorize('review', $submission);
        $data = $request->validate([
            'comment' => ['nullable', 'string'],
            'trainer_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status' => ['nullable', 'in:under_review,revision_required,approved'],
        ]);
        $submission->update([
            'status' => $data['status'] ?? 'under_review',
            'trainer_comment' => $data['comment'] ?? $submission->trainer_comment,
            'trainer_score' => $data['trainer_score'] ?? $submission->trainer_score,
            'final_score' => $data['trainer_score'] ?? $submission->final_score,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);
        Audit::record('submission.review', $submission, $data, $request->user());

        return response()->json(['data' => $submission->fresh()]);
    }

    public function revision(Request $request, Submission $submission): JsonResponse
    {
        $this->authorize('review', $submission);
        $data = $request->validate(['comment' => ['required', 'string']]);
        $submission->update([
            'status' => 'revision_required',
            'trainer_comment' => $data['comment'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);
        $submission->project?->update(['status' => 'revision']);
        Audit::record('submission.revision', $submission, $data, $request->user());

        return response()->json(['data' => $submission]);
    }

    public function approve(Request $request, Submission $submission): JsonResponse
    {
        $this->authorize('review', $submission);
        $data = $request->validate([
            'trainer_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'comment' => ['nullable', 'string'],
        ]);
        $score = $data['trainer_score'] ?? $submission->auto_score ?? 0;
        $submission->update([
            'status' => 'approved',
            'trainer_score' => $score,
            'final_score' => $score,
            'trainer_comment' => $data['comment'] ?? $submission->trainer_comment,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);
        $this->documents->snapshot($submission->project, $request->user(), 'Final', 'final');
        $submission->project?->update(['status' => 'final']);
        $assessment = $this->assessments->evaluateSubmission($submission->fresh(), $request->user());
        $certificate = $this->assessments->issueCertificateIfEligible($submission->fresh('project'), $request->user());
        Audit::record('submission.approve', $submission, ['score' => $score], $request->user());

        return response()->json([
            'data' => $submission->fresh(),
            'assessment' => $assessment,
            'certificate' => $certificate,
        ]);
    }
}
