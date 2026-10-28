<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectElement;
use App\Models\ProjectGrid;
use App\Models\ProjectLevel;
use App\Models\ProjectMaterial;
use App\Models\ProjectVersion;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProjectDocumentService
{
    public function emptyDocument(Project $project): array
    {
        $levelId = (string) Str::uuid();

        return [
            'schemaVersion' => '1.0.0',
            'project' => [
                'id' => $project->id,
                'title' => $project->title,
                'code' => $project->code,
                'unit' => 'millimeter',
            ],
            'levels' => [
                [
                    'id' => $levelId,
                    'projectId' => $project->id,
                    'name' => 'Level 1',
                    'elevation' => 0,
                    'order' => 0,
                ],
            ],
            'grids' => [],
            'elements' => [],
            'materials' => $this->defaultMaterials(),
            'settings' => [
                'gridSize' => 1000,
                'snapEnabled' => true,
                'units' => 'mm',
                'activeLevelId' => $levelId,
            ],
        ];
    }

    public function saveDocument(Project $project, array $document, User $user, bool $checkpoint = false, string $label = 'Autosave'): array
    {
        return DB::transaction(function () use ($project, $document, $user, $checkpoint, $label) {
            $document['schemaVersion'] = $document['schemaVersion'] ?? '1.0.0';
            $document['project']['id'] = $project->id;
            if (empty($document['materials'])) {
                $document['materials'] = $this->defaultMaterials();
            }

            $project->document = $document;
            $project->last_saved_at = now();
            $project->save();

            $this->syncRelational($project, $document, $user);

            $version = null;
            if ($checkpoint) {
                $version = $this->snapshot($project, $user, $label, 'checkpoint');
            }

            Audit::record('project.save', $project, ['checkpoint' => $checkpoint], $user);

            return ['project' => $project->fresh(), 'version' => $version];
        });
    }

    public function snapshot(Project $project, User $user, string $label, string $kind = 'checkpoint'): ProjectVersion
    {
        $number = (int) $project->versions()->max('number') + 1;

        $version = $project->versions()->create([
            'number' => $number,
            'label' => $label,
            'kind' => $kind,
            'document' => $project->document,
            'created_by' => $user->id,
        ]);

        Audit::record('project.version', $project, ['number' => $number, 'label' => $label], $user);

        return $version;
    }

    public function applyOperations(Project $project, array $operations, User $user): array
    {
        $document = $project->document ?? $this->emptyDocument($project);
        $elements = collect($document['elements'] ?? []);
        $levels = collect($document['levels'] ?? []);
        $grids = collect($document['grids'] ?? []);

        foreach ($operations as $op) {
            $type = $op['type'] ?? '';
            $id = $op['id'] ?? null;
            $payload = $op['payload'] ?? [];

            match ($type) {
                'ADD_ELEMENT' => $elements->push($payload),
                'UPDATE_ELEMENT' => $elements = $elements->map(fn ($el) => ($el['id'] ?? null) === $id ? array_replace_recursive($el, $payload) : $el),
                'DELETE_ELEMENT' => $elements = $elements->reject(fn ($el) => ($el['id'] ?? null) === $id || ($el['hostWallId'] ?? null) === $id),
                'ADD_LEVEL' => $levels->push($payload),
                'UPDATE_LEVEL' => $levels = $levels->map(fn ($lv) => ($lv['id'] ?? null) === $id ? array_replace_recursive($lv, $payload) : $lv),
                'DELETE_LEVEL' => $levels = $levels->reject(fn ($lv) => ($lv['id'] ?? null) === $id),
                'ADD_GRID' => $grids->push($payload),
                'UPDATE_GRID' => $grids = $grids->map(fn ($g) => ($g['id'] ?? null) === $id ? array_replace_recursive($g, $payload) : $g),
                'DELETE_GRID' => $grids = $grids->reject(fn ($g) => ($g['id'] ?? null) === $id),
                'REPLACE_DOCUMENT' => $document = $payload,
                default => null,
            };
        }

        if (! collect($operations)->contains(fn ($op) => ($op['type'] ?? '') === 'REPLACE_DOCUMENT')) {
            $document['elements'] = $elements->values()->all();
            $document['levels'] = $levels->values()->all();
            $document['grids'] = $grids->values()->all();
        }

        return $this->saveDocument($project, $document, $user);
    }

    private function syncRelational(Project $project, array $document, User $user): void
    {
        $levelIds = [];
        foreach ($document['levels'] ?? [] as $level) {
            $model = ProjectLevel::query()->updateOrCreate(
                ['id' => $level['id'], 'project_id' => $project->id],
                [
                    'id' => $level['id'],
                    'project_id' => $project->id,
                    'name' => $level['name'] ?? 'Level',
                    'elevation' => $level['elevation'] ?? 0,
                    'sort_order' => $level['order'] ?? $level['sort_order'] ?? 0,
                ]
            );
            $levelIds[] = $model->id;
        }
        ProjectLevel::query()->where('project_id', $project->id)->whereNotIn('id', $levelIds ?: ['00000000-0000-0000-0000-000000000000'])->delete();

        $gridIds = [];
        foreach ($document['grids'] ?? [] as $grid) {
            $model = ProjectGrid::query()->updateOrCreate(
                ['id' => $grid['id'], 'project_id' => $project->id],
                [
                    'id' => $grid['id'],
                    'project_id' => $project->id,
                    'axis' => $grid['axis'] ?? 'X',
                    'label' => $grid['label'] ?? 'A',
                    'position' => $grid['position'] ?? 0,
                ]
            );
            $gridIds[] = $model->id;
        }
        ProjectGrid::query()->where('project_id', $project->id)->whereNotIn('id', $gridIds ?: ['00000000-0000-0000-0000-000000000000'])->delete();

        $materialIds = [];
        foreach ($document['materials'] ?? [] as $material) {
            $model = ProjectMaterial::query()->updateOrCreate(
                ['id' => $material['id']],
                [
                    'id' => $material['id'],
                    'organization_id' => $project->organization_id,
                    'project_id' => $project->id,
                    'name' => $material['name'],
                    'code' => $material['code'] ?? Str::upper($material['name']),
                    'color' => $material['color'] ?? '#888888',
                    'opacity' => $material['opacity'] ?? 1,
                ]
            );
            $materialIds[] = $model->id;
        }

        $elementIds = [];
        foreach ($document['elements'] ?? [] as $element) {
            $model = ProjectElement::query()->withTrashed()->updateOrCreate(
                ['id' => $element['id'], 'project_id' => $project->id],
                [
                    'id' => $element['id'],
                    'project_id' => $project->id,
                    'level_id' => $element['levelId'] ?? $element['level_id'] ?? null,
                    'parent_id' => $element['hostWallId'] ?? $element['parent_id'] ?? null,
                    'type' => $element['type'],
                    'name' => $element['name'] ?? $element['type'],
                    'code' => $element['code'] ?? null,
                    'ifc_class' => $element['ifcClass'] ?? $element['ifc_class'] ?? null,
                    'geometry' => $element['geometry'] ?? [],
                    'transform' => $element['transform'] ?? ['position' => ['x' => 0, 'y' => 0, 'z' => 0], 'rotation' => ['x' => 0, 'y' => 0, 'z' => 0], 'scale' => ['x' => 1, 'y' => 1, 'z' => 1]],
                    'properties' => $element['properties'] ?? [],
                    'metadata' => $element['metadata'] ?? ['createdBy' => $user->id, 'createdAt' => now()->toIso8601String(), 'updatedAt' => now()->toIso8601String()],
                    'material_id' => $element['materialId'] ?? $element['material_id'] ?? null,
                    'updated_by' => $user->id,
                    'deleted_at' => null,
                ]
            );
            if (! $model->created_by) {
                $model->created_by = $user->id;
                $model->save();
            }
            $elementIds[] = $model->id;
        }
        ProjectElement::query()->where('project_id', $project->id)->whereNotIn('id', $elementIds ?: ['00000000-0000-0000-0000-000000000000'])->delete();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function defaultMaterials(): array
    {
        return [
            ['id' => 'mat-concrete', 'name' => 'Concrete', 'code' => 'CONC', 'color' => '#9AA0A6', 'opacity' => 1],
            ['id' => 'mat-brick', 'name' => 'Brick', 'code' => 'BRK', 'color' => '#B85C38', 'opacity' => 1],
            ['id' => 'mat-glass', 'name' => 'Glass', 'code' => 'GLS', 'color' => '#8EC6E6', 'opacity' => 0.35],
            ['id' => 'mat-steel', 'name' => 'Steel', 'code' => 'STL', 'color' => '#5C6770', 'opacity' => 1],
            ['id' => 'mat-wood', 'name' => 'Wood', 'code' => 'WOD', 'color' => '#A67C52', 'opacity' => 1],
            ['id' => 'mat-gypsum', 'name' => 'Gypsum', 'code' => 'GYP', 'color' => '#E8DFD2', 'opacity' => 1],
        ];
    }
}
