<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\Certificate;
use App\Models\Competency;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserCompetency;
use App\Support\Audit;
use Illuminate\Support\Str;

class AssessmentService
{
    public function __construct(
        private ValidationEngine $validation,
        private ProjectDocumentService $documents,
    ) {}

    public function evaluateSubmission(Submission $submission, User $actor): Assessment
    {
        $project = $submission->project()->firstOrFail();
        $report = $this->validation->validate($project);
        $revisionCount = max(0, $submission->versions()->count() - 1);
        $breakdown = $this->validation->breakdown($report, $revisionCount);

        $assessment = Assessment::query()->updateOrCreate(
            ['submission_id' => $submission->id],
            [
                'organization_id' => $submission->organization_id,
                'user_id' => $submission->user_id,
                'completion' => $breakdown['completion'],
                'accuracy' => $breakdown['accuracy'],
                'compliance' => $breakdown['compliance'],
                'discipline' => $breakdown['discipline'],
                'final_score' => $breakdown['final'],
            ]
        );

        $assessment->scores()->delete();
        foreach (['completion' => 0.40, 'accuracy' => 0.30, 'compliance' => 0.20, 'discipline' => 0.10] as $component => $weight) {
            $assessment->scores()->create([
                'component' => $component,
                'score' => $breakdown[$component],
                'weight' => $weight,
            ]);
        }

        $submission->update([
            'auto_score' => $breakdown['final'],
            'score_breakdown' => $breakdown,
            'final_score' => $submission->trainer_score ?? $breakdown['final'],
        ]);

        $this->updateCompetencies($submission, (float) $submission->final_score);

        Audit::record('assessment.evaluate', $assessment, $breakdown, $actor);

        return $assessment->fresh('scores');
    }

    public function adjust(Assessment $assessment, float $delta, string $reason, User $actor): Assessment
    {
        $final = max(0, min(100, (float) $assessment->final_score - (float) $assessment->manual_adjustment + $delta));
        $assessment->update([
            'manual_adjustment' => $delta,
            'adjustment_reason' => $reason,
            'adjusted_by' => $actor->id,
            'final_score' => $final,
        ]);
        $assessment->submission?->update(['final_score' => $final, 'trainer_score' => $final]);
        Audit::record('assessment.adjust', $assessment, ['delta' => $delta, 'reason' => $reason], $actor);

        return $assessment->fresh();
    }

    public function issueCertificateIfEligible(Submission $submission, User $actor): ?Certificate
    {
        $score = (float) ($submission->final_score ?? 0);
        if ($score < 75 || ! $submission->project?->training_program_id) {
            return null;
        }

        $existing = Certificate::query()
            ->where('user_id', $submission->user_id)
            ->where('training_program_id', $submission->project->training_program_id)
            ->first();
        if ($existing) {
            return $existing;
        }

        $level = $score >= 90 ? 'Advanced' : ($score >= 80 ? 'Intermediate' : 'Foundation');
        $count = Certificate::query()->count() + 1;
        $certificate = Certificate::query()->create([
            'organization_id' => $submission->organization_id,
            'user_id' => $submission->user_id,
            'training_program_id' => $submission->project->training_program_id,
            'certificate_number' => sprintf('BIM-%s-%s-%04d', strtoupper(substr($submission->organization_id, 0, 4)), now()->year, $count),
            'competency_level' => $level,
            'final_score' => $score,
            'issued_at' => now()->toDateString(),
            'verification_token' => Str::lower(Str::ulid()),
        ]);

        Audit::record('certificate.issued', $certificate, ['number' => $certificate->certificate_number], $actor);

        return $certificate;
    }

    private function updateCompetencies(Submission $submission, float $score): void
    {
        $map = [
            'bim-fundamental' => 1.0,
            'architecture-modeling' => 1.0,
            'bim-coordination-basic' => 0.7,
        ];

        foreach ($map as $slug => $weight) {
            $competency = Competency::query()->where('slug', $slug)->first();
            if (! $competency) {
                continue;
            }
            $value = round($score * $weight, 2);
            $level = $value >= 85 ? 'proficient' : ($value >= 70 ? 'intermediate' : 'beginner');
            UserCompetency::query()->updateOrCreate(
                [
                    'organization_id' => $submission->organization_id,
                    'user_id' => $submission->user_id,
                    'competency_id' => $competency->id,
                ],
                ['score' => max($value, 0), 'level' => $level]
            );
        }
    }
}
