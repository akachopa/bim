<?php

namespace Tests\Unit;

use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Services\ValidationEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ValidationEngineTest extends TestCase
{
    use RefreshDatabase;

    public function test_flags_door_without_host_and_wall_without_level(): void
    {
        $org = Organization::query()->create(['name' => 'O', 'slug' => 'o', 'code' => 'O']);
        $user = User::factory()->create();
        $project = Project::query()->create([
            'organization_id' => $org->id,
            'owner_id' => $user->id,
            'title' => 'T',
            'code' => 'T',
            'status' => 'draft',
            'unit' => 'millimeter',
            'schema_version' => '1.0.0',
        ]);

        $report = (new ValidationEngine)->validate($project, [
            'levels' => [['id' => 'L1', 'name' => '1', 'elevation' => 0]],
            'elements' => [
                [
                    'id' => 'w1',
                    'type' => 'wall',
                    'name' => 'Wall',
                    'geometry' => ['start' => ['x' => 0, 'y' => 0], 'end' => ['x' => 5000, 'y' => 0], 'height' => 3000, 'thickness' => 150],
                ],
                [
                    'id' => 'd1',
                    'type' => 'door',
                    'name' => 'Door',
                    'levelId' => 'L1',
                    'geometry' => ['width' => 900, 'height' => 2100, 'offset' => 500, 'sillHeight' => 0],
                ],
            ],
        ]);

        $codes = collect($report['errors'])->pluck('code')->all();
        $this->assertContains('wall-level', $codes);
        $this->assertContains('host-required', $codes);
        $this->assertFalse($report['valid']);
    }

    public function test_min_element_count_rule(): void
    {
        $engine = new ValidationEngine;
        $result = $engine->evaluateRule('MIN_ELEMENT_COUNT', ['elementType' => 'wall', 'min' => 12], [
            'elements' => array_fill(0, 4, ['type' => 'wall']),
        ]);
        $this->assertFalse($result['passed']);

        $ok = $engine->evaluateRule('MIN_ELEMENT_COUNT', ['elementType' => 'wall', 'min' => 4], [
            'elements' => array_fill(0, 4, ['type' => 'wall']),
        ]);
        $this->assertTrue($ok['passed']);
    }
}
