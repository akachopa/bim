<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Competency;
use App\Models\UserCompetency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompetencyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $competencies = Competency::query()->orderBy('name')->get();
        $mine = UserCompetency::query()
            ->with('competency')
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json([
            'data' => $competencies,
            'scores' => $mine,
        ]);
    }

    public function certificates(Request $request): JsonResponse
    {
        $query = Certificate::query()->with(['program:id,title,code', 'organization:id,name']);
        if (! $request->user()->isTrainer()) {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json(['data' => $query->latest()->get()]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $orgId = $user->current_organization_id;

        $base = [
            'user' => $user->load('organizations')->toAuthArray(),
        ];

        if ($user->isTrainer($orgId)) {
            $base['trainer'] = [
                'participants' => \App\Models\TrainingEnrollment::query()->distinct('user_id')->count('user_id'),
                'classes' => \App\Models\TrainingClass::query()->count(),
                'submissions' => \App\Models\Submission::query()->whereIn('status', ['submitted', 'resubmitted', 'under_review'])->count(),
                'average_score' => round((float) \App\Models\Submission::query()->avg('final_score'), 1),
                'issues' => \App\Models\Issue::query()->where('status', 'open')->count(),
                'revisions' => \App\Models\Submission::query()->where('status', 'revision_required')->count(),
                'certificates' => Certificate::query()->count(),
            ];
        }

        $base['participant'] = [
            'programs' => \App\Models\TrainingProgram::query()->count(),
            'labs' => \App\Models\BimLab::query()->count(),
            'projects' => \App\Models\Project::query()->where('owner_id', $user->id)->count(),
            'certificates' => Certificate::query()->where('user_id', $user->id)->count(),
            'competencies' => UserCompetency::query()->with('competency')->where('user_id', $user->id)->get(),
        ];

        return response()->json(['data' => $base]);
    }
}
