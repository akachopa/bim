<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_token_and_user(): void
    {
        $org = Organization::query()->create([
            'name' => 'Org A', 'slug' => 'org-a', 'code' => 'OA',
        ]);
        $user = User::factory()->create([
            'email' => 'peserta@bim.test',
            'current_organization_id' => $org->id,
        ]);
        $org->users()->attach($user->id, ['id' => (string) Str::uuid(), 'role' => 'participant']);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'peserta@bim.test',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'peserta@bim.test')
            ->assertJsonStructure(['token', 'user' => ['id', 'role', 'organizations']]);
    }

    public function test_login_rejects_bad_password(): void
    {
        User::factory()->create(['email' => 'a@b.test']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'a@b.test',
            'password' => 'salah',
        ])->assertStatus(422);
    }
}
