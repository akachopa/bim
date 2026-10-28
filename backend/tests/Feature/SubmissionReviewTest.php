<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Services\ProjectDocumentService;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubmissionReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_submit_review_revision_and_approve_flow(): void
    {
        $org = Organization::query()->create(['name' => 'Org', 'slug' => 'org', 'code' => 'ORG']);
        app(Tenant::class)->set($org->id);
        $peserta = User::factory()->create(['current_organization_id' => $org->id]);
        $trainer = User::factory()->create(['current_organization_id' => $org->id]);
        $org->users()->attach($peserta->id, ['id' => (string) Str::uuid(), 'role' => 'participant']);
        $org->users()->attach($trainer->id, ['id' => (string) Str::uuid(), 'role' => 'trainer']);

        $project = Project::query()->create([
            'organization_id' => $org->id,
            'owner_id' => $peserta->id,
            'title' => 'Tugas',
            'code' => 'T1',
            'status' => 'draft',
            'unit' => 'millimeter',
            'schema_version' => '1.0.0',
        ]);
        app(ProjectDocumentService::class)->saveDocument(
            $project,
            app(ProjectDocumentService::class)->emptyDocument($project),
            $peserta,
            true,
            'v1 Initial',
        );

        Sanctum::actingAs($peserta);
        $submit = $this->withHeaders(['X-Organization-Id' => $org->id])
            ->postJson("/api/v1/projects/{$project->id}/submit")
            ->assertCreated();

        $submissionId = $submit->json('data.id');
        $this->assertContains($submit->json('data.status'), ['submitted', 'resubmitted']);

        Sanctum::actingAs($trainer);
        $this->withHeaders(['X-Organization-Id' => $org->id])
            ->postJson("/api/v1/submissions/{$submissionId}/revision", [
                'comment' => 'Tambah wall di sisi utara.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'revision_required');

        Sanctum::actingAs($peserta);
        $this->withHeaders(['X-Organization-Id' => $org->id])
            ->postJson("/api/v1/projects/{$project->id}/submit")
            ->assertCreated()
            ->assertJsonPath('data.status', 'resubmitted');

        Sanctum::actingAs($trainer);
        $this->withHeaders(['X-Organization-Id' => $org->id])
            ->postJson("/api/v1/submissions/{$submissionId}/approve", [
                'trainer_score' => 82,
                'comment' => 'Sudah sesuai.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.final_score', 82);
    }
}
