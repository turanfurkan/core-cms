<?php

namespace Tests\Feature\ApiDomain;

use App\Domains\Identity\Models\User;
use App\Domains\API\Models\ApiKey;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ApiKeyCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    #[Test]
    public function admin_can_manage_api_keys_crud(): void
    {
        // 1. Create API Key
        $responseCreate = $this->actingAs($this->admin)
            ->postJson('/api/admin/api-keys', [
                'name' => 'NextJS Frontend',
                'scopes' => ['content:read', 'navigation:read'],
                'expires_at' => now()->addDays(30)->toIso8601String(),
                'is_active' => true,
            ]);

        $responseCreate->assertStatus(201);
        $responseCreate->assertJsonPath('data.name', 'NextJS Frontend');
        $responseCreate->assertJsonPath('data.scopes', ['content:read', 'navigation:read']);
        $responseCreate->assertJsonStructure(['data' => ['id', 'raw_key', 'hint']]);

        $rawKey = $responseCreate->json('data.raw_key');
        $apiKeyId = $responseCreate->json('data.id');
        $this->assertNotNull($rawKey);
        $this->assertStringStartsWith('corecms_key_', $rawKey);

        // Verify hashed key matches in DB
        $hashedKey = hash('sha256', $rawKey);
        $this->assertDatabaseHas('api_keys', [
            'id' => $apiKeyId,
            'hashed_key' => $hashedKey,
        ]);

        // 2. List API Keys
        $responseList = $this->actingAs($this->admin)
            ->getJson('/api/admin/api-keys');

        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');
        $responseList->assertJsonMissingPath('data.0.raw_key'); // Hashed in DB, must not be shown

        // 3. Show API Key
        $responseShow = $this->actingAs($this->admin)
            ->getJson("/api/admin/api-keys/{$apiKeyId}");

        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.name', 'NextJS Frontend');
        $responseShow->assertJsonMissingPath('data.raw_key'); // Hashed in DB, must not be shown

        // 4. Update API Key
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/api-keys/{$apiKeyId}", [
                'name' => 'NextJS Frontend Updated',
                'scopes' => ['*'],
                'expires_at' => now()->addDays(60)->toIso8601String(),
                'is_active' => false,
            ]);

        $responseUpdate->assertStatus(200);
        $responseUpdate->assertJsonPath('data.name', 'NextJS Frontend Updated');
        $responseUpdate->assertJsonPath('data.scopes', ['*']);
        $responseUpdate->assertJsonPath('data.is_active', false);
        $responseUpdate->assertJsonMissingPath('data.raw_key'); // Must not be shown on update

        // 5. Delete API Key
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/api-keys/{$apiKeyId}");

        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('api_keys', ['id' => $apiKeyId]);
    }

    #[Test]
    public function validation_fails_if_scopes_are_missing_or_invalid(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/api-keys', [
                'name' => 'Portal',
                'scopes' => ['invalid:scope'], // not allowed in Rule::in
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['scopes.0']);
    }
}
