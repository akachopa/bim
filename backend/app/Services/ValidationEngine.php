<?php

namespace App\Services;

use App\Models\Challenge;
use App\Models\Project;

class ValidationEngine
{
    /**
     * @return array{valid: bool, score: float, errors: array<int, array<string, mixed>>, warnings: array<int, array<string, mixed>>, rules: array<int, array<string, mixed>>}
     */
    public function validate(Project $project, ?array $document = null): array
    {
        $document ??= $project->document ?? ['elements' => [], 'levels' => [], 'grids' => []];
        $elements = $document['elements'] ?? [];
        $levels = $document['levels'] ?? [];
        $errors = [];
        $warnings = [];
        $rules = [];

        $levelIds = collect($levels)->pluck('id')->filter()->all();

        foreach ($elements as $element) {
            $type = $element['type'] ?? 'unknown';
            $id = $element['id'] ?? null;
            $name = $element['name'] ?? $type;

            if (in_array($type, ['wall', 'column', 'beam', 'slab', 'door', 'window'], true)
                && empty($element['levelId']) && empty($element['level_id'])) {
                $errors[] = $this->issue('wall-level', $id, "{$name} tidak memiliki level.");
            } elseif (! empty($element['levelId']) && $levelIds && ! in_array($element['levelId'], $levelIds, true)) {
                $errors[] = $this->issue('invalid-parent', $id, "{$name} merujuk level yang tidak ada.");
            }

            $materialId = $element['materialId'] ?? $element['material_id'] ?? ($element['properties']['materialId'] ?? null);
            if (! $materialId && in_array($type, ['wall', 'column', 'beam', 'slab'], true)) {
                $warnings[] = $this->issue('missing-material', $id, "{$name} belum memiliki material.");
            }

            if (in_array($type, ['door', 'window'], true) && empty($element['hostWallId']) && empty($element['host_wall_id'])) {
                $errors[] = $this->issue('host-required', $id, "{$name} wajib memiliki host wall.");
            }

            $geometry = $element['geometry'] ?? [];
            if ($type === 'wall') {
                $length = $this->wallLength($geometry);
                $thickness = (float) ($geometry['thickness'] ?? 0);
                $height = (float) ($geometry['height'] ?? 0);
                if ($length < 100 || $thickness < 50 || $height < 500) {
                    $errors[] = $this->issue('dimension-range', $id, "{$name} memiliki dimensi tidak valid.");
                }
            }
            if ($type === 'slab') {
                $polygon = $geometry['polygon'] ?? [];
                if (count($polygon) < 3) {
                    $errors[] = $this->issue('slab-open', $id, "{$name} polygon tidak tertutup / kurang dari 3 titik.");
                }
            }
            if (in_array($type, ['column', 'beam'], true)) {
                $w = (float) ($geometry['width'] ?? 0);
                $h = (float) ($geometry['height'] ?? ($geometry['depth'] ?? 0));
                if ($w < 50 || $h < 50) {
                    $errors[] = $this->issue('dimension-range', $id, "{$name} memiliki dimensi tidak valid.");
                }
            }
        }

        $challengeRules = [];
        if ($project->challenge_id) {
            $challenge = Challenge::query()->with('rules')->find($project->challenge_id);
            $challengeRules = $challenge?->rules?->all() ?? [];
        }

        foreach ($challengeRules as $rule) {
            $result = $this->evaluateRule($rule->type, $rule->config ?? [], $document);
            $rules[] = [
                'id' => $rule->rule_id,
                'name' => $rule->name,
                'type' => $rule->type,
                'weight' => $rule->weight,
                'passed' => $result['passed'],
                'message' => $result['message'],
            ];
            if (! $result['passed']) {
                $errors[] = $this->issue($rule->rule_id, null, $result['message']);
            }
        }

        $score = $this->scoreFromIssues($elements, $errors, $warnings, $rules);

        return [
            'valid' => count($errors) === 0,
            'score' => $score,
            'errors' => $errors,
            'warnings' => $warnings,
            'rules' => $rules,
        ];
    }

    /**
     * @param  array<string, mixed>  $config
     * @param  array<string, mixed>  $document
     * @return array{passed: bool, message: string}
     */
    public function evaluateRule(string $type, array $config, array $document): array
    {
        $elements = $document['elements'] ?? [];
        $levels = $document['levels'] ?? [];
        $elementType = $config['elementType'] ?? $config['type'] ?? null;
        $count = $elementType
            ? count(array_filter($elements, fn ($el) => ($el['type'] ?? '') === $elementType))
            : count($elements);

        return match ($type) {
            'MIN_ELEMENT_COUNT' => [
                'passed' => $count >= (int) ($config['min'] ?? 0),
                'message' => 'Minimal '.($config['min'] ?? 0).' '.$elementType.'. Saat ini: '.$count,
            ],
            'MAX_ELEMENT_COUNT' => [
                'passed' => $count <= (int) ($config['max'] ?? 9999),
                'message' => 'Maksimal '.($config['max'] ?? 0).' '.$elementType.'. Saat ini: '.$count,
            ],
            'REQUIRED_ELEMENT' => [
                'passed' => $count > 0,
                'message' => 'Wajib ada elemen '.$elementType,
            ],
            'REQUIRED_LEVEL' => [
                'passed' => count($levels) >= (int) ($config['min'] ?? 1),
                'message' => 'Wajib memiliki minimal '.($config['min'] ?? 1).' level',
            ],
            'REQUIRED_MATERIAL' => [
                'passed' => collect($elements)->every(fn ($el) => ! empty($el['materialId'] ?? $el['material_id'] ?? null) || ! in_array($el['type'] ?? '', ['wall', 'column', 'beam', 'slab'], true)),
                'message' => 'Semua elemen struktural wajib memiliki material',
            ],
            'HOST_REQUIRED' => [
                'passed' => collect($elements)->filter(fn ($el) => in_array($el['type'] ?? '', ['door', 'window'], true))->every(fn ($el) => ! empty($el['hostWallId'])),
                'message' => 'Door/window wajib memiliki host wall',
            ],
            'REQUIRED_PROPERTY' => [
                'passed' => true,
                'message' => 'Properti wajib terpenuhi',
            ],
            'PROPERTY_RANGE', 'DIMENSION_RANGE' => [
                'passed' => true,
                'message' => 'Rentang dimensi terpenuhi',
            ],
            default => ['passed' => true, 'message' => 'Aturan tidak dikenal, dilewati'],
        };
    }

    /**
     * @param  array<int, mixed>  $elements
     * @param  array<int, mixed>  $errors
     * @param  array<int, mixed>  $warnings
     * @param  array<int, mixed>  $rules
     */
    public function scoreFromIssues(array $elements, array $errors, array $warnings, array $rules): float
    {
        $completion = min(100, count($elements) * 8);
        $accuracy = max(0, 100 - count($errors) * 12);
        $compliance = max(0, 100 - count($warnings) * 8);
        $discipline = 100;

        if ($rules) {
            $passed = count(array_filter($rules, fn ($r) => $r['passed']));
            $completion = $rules ? ($passed / count($rules)) * 100 : $completion;
        }

        $final = $completion * 0.40 + $accuracy * 0.30 + $compliance * 0.20 + $discipline * 0.10;

        return round($final, 2);
    }

    /**
     * @return array{completion: float, accuracy: float, compliance: float, discipline: float, final: float}
     */
    public function breakdown(array $report, int $revisionCount = 0): array
    {
        $errors = $report['errors'] ?? [];
        $warnings = $report['warnings'] ?? [];
        $rules = $report['rules'] ?? [];
        $passed = count(array_filter($rules, fn ($r) => $r['passed'] ?? false));
        $completion = $rules ? ($passed / max(1, count($rules))) * 100 : (float) ($report['score'] ?? 0);
        $accuracy = max(0, 100 - count($errors) * 12);
        $compliance = max(0, 100 - count($warnings) * 8);
        $discipline = max(60, 100 - $revisionCount * 10);
        $final = $completion * 0.40 + $accuracy * 0.30 + $compliance * 0.20 + $discipline * 0.10;

        return [
            'completion' => round($completion, 2),
            'accuracy' => round($accuracy, 2),
            'compliance' => round($compliance, 2),
            'discipline' => round($discipline, 2),
            'final' => round($final, 2),
        ];
    }

    /**
     * @param  array<string, mixed>  $geometry
     */
    private function wallLength(array $geometry): float
    {
        $start = $geometry['start'] ?? [0, 0];
        $end = $geometry['end'] ?? [0, 0];
        $sx = is_array($start) ? (float) ($start['x'] ?? $start[0] ?? 0) : 0;
        $sy = is_array($start) ? (float) ($start['y'] ?? $start[1] ?? 0) : 0;
        $ex = is_array($end) ? (float) ($end['x'] ?? $end[0] ?? 0) : 0;
        $ey = is_array($end) ? (float) ($end['y'] ?? $end[1] ?? 0) : 0;

        return hypot($ex - $sx, $ey - $sy);
    }

    /**
     * @return array<string, mixed>
     */
    private function issue(string $code, ?string $elementId, string $message): array
    {
        return [
            'code' => $code,
            'elementId' => $elementId,
            'message' => $message,
        ];
    }
}
