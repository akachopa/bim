<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BimLab;
use App\Models\Challenge;
use App\Models\IfcJob;
use App\Models\Project;
use App\Services\ProjectDocumentService;
use App\Services\ValidationEngine;
use App\Support\Audit;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function __construct(
        private ProjectDocumentService $documents,
        private ValidationEngine $validation,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Project::class);
        $query = Project::query()->with(['owner:id,name,email'])->latest();
        if ($request->user()->roleIn(app(Tenant::class)->id()) === 'participant') {
            $query->where('owner_id', $request->user()->id);
        }
        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        return response()->json(['data' => $query->paginate(20)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Project::class);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'training_program_id' => ['nullable', 'uuid'],
            'challenge_id' => ['nullable', 'uuid'],
            'bim_lab_id' => ['nullable', 'uuid'],
            'template' => ['nullable', 'array'],
        ]);

        $orgId = app(Tenant::class)->requireId();
        $project = Project::query()->create([
            'organization_id' => $orgId,
            'owner_id' => $request->user()->id,
            'training_program_id' => $data['training_program_id'] ?? null,
            'challenge_id' => $data['challenge_id'] ?? null,
            'bim_lab_id' => $data['bim_lab_id'] ?? null,
            'title' => $data['title'],
            'code' => 'PRJ-'.strtoupper(Str::random(6)),
            'description' => $data['description'] ?? null,
            'status' => 'draft',
            'unit' => 'millimeter',
            'schema_version' => '1.0.0',
            'settings' => ['gridSize' => 1000, 'snapEnabled' => true],
        ]);

        $template = $data['template'] ?? null;
        if (! $template && ! empty($data['bim_lab_id'])) {
            $template = BimLab::query()->find($data['bim_lab_id'])?->project_template;
        }
        if (! $template && ! empty($data['challenge_id'])) {
            $template = Challenge::query()->find($data['challenge_id'])?->project_template;
        }

        $document = $template ?: $this->documents->emptyDocument($project);
        $document['project']['id'] = $project->id;
        $document['project']['title'] = $project->title;
        $document['project']['code'] = $project->code;
        $this->documents->saveDocument($project, $document, $request->user(), true, 'v1 Initial');

        Audit::record('project.create', $project, [], $request->user());

        return response()->json(['data' => $project->fresh(['levels', 'grids'])], 201);
    }

    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $project->load(['levels', 'grids', 'elements', 'versions', 'owner:id,name,email', 'challenge.rules', 'lab.steps']);

        return response()->json(['data' => $project]);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'string'],
        ]);
        $project->update($data);
        Audit::record('project.update', $project, $data, $request->user());

        return response()->json(['data' => $project]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);
        $project->delete();
        Audit::record('project.delete', $project, [], $request->user());

        return response()->json(['ok' => true]);
    }

    public function document(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json(['data' => $project->document ?? $this->documents->emptyDocument($project)]);
    }

    public function saveDocument(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate([
            'document' => ['required', 'array'],
            'checkpoint' => ['sometimes', 'boolean'],
            'label' => ['nullable', 'string'],
        ]);
        $result = $this->documents->saveDocument(
            $project,
            $data['document'],
            $request->user(),
            (bool) ($data['checkpoint'] ?? false),
            $data['label'] ?? 'Manual save',
        );

        return response()->json(['data' => $result['project']->document, 'saved_at' => $result['project']->last_saved_at]);
    }

    public function operations(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate([
            'operations' => ['required', 'array', 'min:1'],
            'operations.*.type' => ['required', 'string'],
        ]);
        $result = $this->documents->applyOperations($project, $data['operations'], $request->user());

        return response()->json(['data' => $result['project']->document]);
    }

    public function levels(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        if ($request->isMethod('post')) {
            $this->authorize('update', $project);
            $data = $request->validate([
                'name' => ['required', 'string'],
                'elevation' => ['required', 'integer'],
                'sort_order' => ['nullable', 'integer'],
            ]);
            $level = $project->levels()->create($data);
            $doc = $project->document ?? $this->documents->emptyDocument($project);
            $doc['levels'][] = [
                'id' => $level->id,
                'projectId' => $project->id,
                'name' => $level->name,
                'elevation' => $level->elevation,
                'order' => $level->sort_order,
            ];
            $this->documents->saveDocument($project, $doc, $request->user());

            return response()->json(['data' => $level], 201);
        }

        return response()->json(['data' => $project->levels()->orderBy('sort_order')->get()]);
    }

    public function updateLevel(Request $request, Project $project, string $level): JsonResponse
    {
        $this->authorize('update', $project);
        $model = $project->levels()->whereKey($level)->firstOrFail();
        $model->update($request->validate([
            'name' => ['sometimes', 'string'],
            'elevation' => ['sometimes', 'integer'],
            'sort_order' => ['sometimes', 'integer'],
        ]));

        return response()->json(['data' => $model]);
    }

    public function destroyLevel(Request $request, Project $project, string $level): JsonResponse
    {
        $this->authorize('update', $project);
        $project->levels()->whereKey($level)->firstOrFail()->delete();

        return response()->json(['ok' => true]);
    }

    public function grids(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        if ($request->isMethod('post')) {
            $this->authorize('update', $project);
            $data = $request->validate([
                'axis' => ['required', 'in:X,Y'],
                'label' => ['required', 'string'],
                'position' => ['required', 'integer'],
            ]);
            $grid = $project->grids()->create($data);

            return response()->json(['data' => $grid], 201);
        }

        return response()->json(['data' => $project->grids()->get()]);
    }

    public function updateGrid(Request $request, Project $project, string $grid): JsonResponse
    {
        $this->authorize('update', $project);
        $model = $project->grids()->whereKey($grid)->firstOrFail();
        $model->update($request->validate([
            'axis' => ['sometimes', 'in:X,Y'],
            'label' => ['sometimes', 'string'],
            'position' => ['sometimes', 'integer'],
        ]));

        return response()->json(['data' => $model]);
    }

    public function destroyGrid(Request $request, Project $project, string $grid): JsonResponse
    {
        $this->authorize('update', $project);
        $project->grids()->whereKey($grid)->firstOrFail()->delete();

        return response()->json(['ok' => true]);
    }

    public function elements(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        if ($request->isMethod('post')) {
            $this->authorize('update', $project);
            $data = $request->validate([
                'type' => ['required', 'string'],
                'name' => ['required', 'string'],
                'level_id' => ['nullable', 'uuid'],
                'geometry' => ['required', 'array'],
                'properties' => ['nullable', 'array'],
                'transform' => ['nullable', 'array'],
                'material_id' => ['nullable', 'string'],
                'ifc_class' => ['nullable', 'string'],
                'code' => ['nullable', 'string'],
                'parent_id' => ['nullable', 'uuid'],
            ]);
            $element = $project->elements()->create([
                ...$data,
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
                'metadata' => [
                    'createdBy' => $request->user()->id,
                    'createdAt' => now()->toIso8601String(),
                    'updatedAt' => now()->toIso8601String(),
                ],
            ]);
            Audit::record('element.create', $element, ['type' => $element->type], $request->user());

            return response()->json(['data' => $element], 201);
        }

        return response()->json(['data' => $project->elements()->get()]);
    }

    public function updateElement(Request $request, Project $project, string $element): JsonResponse
    {
        $this->authorize('update', $project);
        $model = $project->elements()->whereKey($element)->firstOrFail();
        $model->update($request->all());
        Audit::record('element.update', $model, [], $request->user());

        return response()->json(['data' => $model]);
    }

    public function destroyElement(Request $request, Project $project, string $element): JsonResponse
    {
        $this->authorize('update', $project);
        $model = $project->elements()->whereKey($element)->firstOrFail();
        $project->elements()->where('parent_id', $model->id)->delete();
        $model->delete();
        Audit::record('element.delete', $model, [], $request->user());

        return response()->json(['ok' => true]);
    }

    public function batchElements(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate(['operations' => ['required', 'array']]);
        $result = $this->documents->applyOperations($project, $data['operations'], $request->user());

        return response()->json(['data' => $result['project']->document]);
    }

    public function versions(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        if ($request->isMethod('post')) {
            $this->authorize('update', $project);
            $data = $request->validate([
                'label' => ['required', 'string'],
                'kind' => ['nullable', 'string'],
            ]);
            $version = $this->documents->snapshot($project, $request->user(), $data['label'], $data['kind'] ?? 'checkpoint');

            return response()->json(['data' => $version], 201);
        }

        return response()->json(['data' => $project->versions()->get()]);
    }

    public function showVersion(Project $project, string $version): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json(['data' => $project->versions()->whereKey($version)->firstOrFail()]);
    }

    public function validateModel(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $document = $request->input('document', $project->document);
        $report = $this->validation->validate($project, $document);
        Audit::record('project.validate', $project, ['valid' => $report['valid'], 'score' => $report['score']], $request->user());

        return response()->json($report);
    }

    public function exportIfc(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $job = IfcJob::query()->create([
            'organization_id' => $project->organization_id,
            'project_id' => $project->id,
            'type' => 'export',
            'status' => 'queued',
        ]);

        $url = rtrim((string) config('services.ifc.url', env('IFC_SERVICE_URL', 'http://127.0.0.1:8001')), '/');
        try {
            $response = Http::timeout(8)->post($url.'/export', [
                'job_id' => $job->id,
                'document' => $project->document,
            ]);
            if ($response->successful()) {
                $job->update(['status' => 'completed', 'result' => $response->json()]);
            } else {
                $job->update(['status' => 'failed', 'error' => $response->body()]);
            }
        } catch (\Throwable $e) {
            $job->update(['status' => 'failed', 'error' => $e->getMessage()]);
        }

        return response()->json(['data' => $job->fresh()]);
    }

    public function ifcJob(string $id): JsonResponse
    {
        return response()->json(['data' => IfcJob::query()->findOrFail($id)]);
    }
}
