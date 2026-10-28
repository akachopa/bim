<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_participant_cannot_see_other_organization_project(): void
    {
        [$orgA, $userA] = $this->orgUser('A', 'participant');
        [$orgB, $userB] = $this->orgUser('B', 'participant');

        app(Tenant::class)->set($orgB->id);
        $foreign = Project::query()->create([
            'organization_id' => $orgB->id,
            'owner_id' => $userB->id,
            'title' => 'Rahasia',
            'code' => 'SEC',
            'status' => 'draft',
            'unit' => 'millimeter',
            'schema_version' => '1.0.0',
        ]);

        Sanctum::actingAs($userA);
        $this->withHeaders(['X-Organization-Id' => $orgA->id])
            ->getJson("/api/v1/projects/{$foreign->id}")
            ->assertForbidden();
    }

    /**
     * @return array{0: Organization, 1: User}
     */
    private function orgUser(string $suffix, string $role): array
    {
        $org = Organization::query()->create([
            'name' => "Org {$suffix}",
            'slug' => 'org-'.strtolower($suffix),
            'code' => 'O'.$suffix,
        ]);
        $user = User::factory()->create(['current_organization_id' => $org->id]);
        $org->users()->attach($user->id, ['id' => (string) Str::uuid(), 'role' => $role]);

        return [$org, $user];
    }
}
