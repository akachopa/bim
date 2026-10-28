<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_and_reload_project_document(): void
    {
        [$user, $headers] = $this->member();

        Sanctum::actingAs($user);
        $create = $this->withHeaders($headers)
            ->postJson('/api/v1/projects', ['title' => 'Gedung Kantor']);

        $create->assertCreated()->assertJsonPath('data.title', 'Gedung Kantor');
        $id = $create->json('data.id');

        $doc = $this->withHeaders($headers)
            ->getJson("/api/v1/projects/{$id}/document")
            ->assertOk()
            ->json('data');

        $this->assertSame('1.0.0', $doc['schemaVersion']);
        $this->assertNotEmpty($doc['levels']);
        $this->assertSame($id, $doc['project']['id']);

        $doc['elements'][] = [
            'id' => (string) Str::uuid(),
            'type' => 'wall',
            'name' => 'Wall 1',
            'ifcClass' => 'IfcWall',
            'levelId' => $doc['levels'][0]['id'],
            'materialId' => 'mat-concrete',
            'geometry' => [
                'start' => ['x' => 0, 'y' => 0],
                'end' => ['x' => 5000, 'y' => 0],
                'height' => 3000,
                'thickness' => 150,
                'baseOffset' => 0,
            ],
            'transform' => ['position' => ['x' => 0, 'y' => 0, 'z' => 0], 'rotation' => ['x' => 0, 'y' => 0, 'z' => 0], 'scale' => ['x' => 1, 'y' => 1, 'z' => 1]],
            'properties' => [],
        ];

        $this->withHeaders($headers)
            ->putJson("/api/v1/projects/{$id}/document", ['document' => $doc])
            ->assertOk();

        $reloaded = $this->withHeaders($headers)
            ->getJson("/api/v1/projects/{$id}/document")
            ->json('data');

        $this->assertCount(1, $reloaded['elements']);
        $this->assertSame('wall', $reloaded['elements'][0]['type']);
        $this->assertSame(5000, $reloaded['elements'][0]['geometry']['end']['x']);
    }

    /**
     * @return array{0: User, 1: array<string, string>}
     */
    private function member(): array
    {
        $org = Organization::query()->create(['name' => 'Org', 'slug' => 'org', 'code' => 'ORG']);
        $user = User::factory()->create(['current_organization_id' => $org->id]);
        $org->users()->attach($user->id, ['id' => (string) Str::uuid(), 'role' => 'participant']);

        return [$user, ['X-Organization-Id' => $org->id]];
    }
}
