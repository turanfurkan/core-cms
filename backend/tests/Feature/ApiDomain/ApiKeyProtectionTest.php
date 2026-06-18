<?php

namespace Tests\Feature\ApiDomain;

use App\Domains\API\Models\ApiKey;
use App\Domains\Settings\Models\Setting;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ApiKeyProtectionTest extends TestCase
{
    use RefreshDatabase;

    protected string $rawKey = 'corecms_key_7777777777777777777777777777777777777777';
    protected string $hashedKey;
    protected ApiKey $apiKey;

    protected function setUp(): void
    {
        parent::setUp();
        config(['api.keys_enabled' => true]);
        $this->seed(SettingsSeeder::class);
        $this->hashedKey = hash('sha256', $this->rawKey);
    }

    private function createKey(array $scopes = ['settings:read'], bool $isActive = true, ?string $expiresAt = null): ApiKey
    {
        return ApiKey::create([
            'name' => 'Test Portal',
            'hashed_key' => $this->hashedKey,
            'hint' => 'corecms_key_...7777',
            'scopes' => $scopes,
            'expires_at' => $expiresAt,
            'is_active' => $isActive,
        ]);
    }

    #[Test]
    public function public_endpoint_fails_with_401_if_api_key_is_missing(): void
    {
        $response = $this->getJson('/api/settings/public');
        $response->assertStatus(401);
        $response->assertJsonPath('error_code', 'API.UNAUTHORIZED');
    }

    #[Test]
    public function public_endpoint_fails_with_401_if_api_key_is_invalid(): void
    {
        $response = $this->withHeaders(['X-API-Key' => 'invalid-token-value'])
            ->getJson('/api/settings/public');

        $response->assertStatus(401);
        $response->assertJsonPath('error_code', 'API.INVALID_KEY');
    }

    #[Test]
    public function public_endpoint_fails_with_403_if_api_key_lacks_required_scope(): void
    {
        $this->createKey(scopes: ['content:read']); // lacks settings:read

        $response = $this->withHeaders(['X-API-Key' => $this->rawKey])
            ->getJson('/api/settings/public');

        $response->assertStatus(403);
        $response->assertJsonPath('error_code', 'API.FORBIDDEN');
    }

    #[Test]
    public function public_endpoint_succeeds_with_valid_api_key_scope(): void
    {
        $key = $this->createKey(scopes: ['settings:read']);

        $this->assertNull($key->last_used_at);

        $response = $this->withHeaders(['X-API-Key' => $this->rawKey])
            ->getJson('/api/settings/public');

        $response->assertStatus(200);
        
        // Assert public settings return
        $response->assertJsonFragment(['key' => 'site.name']);

        // Assert last_used_at is updated
        $key->refresh();
        $this->assertNotNull($key->last_used_at);
    }

    #[Test]
    public function public_endpoint_succeeds_with_bearer_token_and_wildcard_scope(): void
    {
        $this->createKey(scopes: ['*']); // wildcard scope gives all accesses

        $response = $this->withToken($this->rawKey) // Authorization: Bearer <KEY>
            ->getJson('/api/settings/public');

        $response->assertStatus(200);
    }

    #[Test]
    public function public_endpoint_fails_if_key_is_inactive(): void
    {
        $this->createKey(scopes: ['settings:read'], isActive: false);

        $response = $this->withHeaders(['X-API-Key' => $this->rawKey])
            ->getJson('/api/settings/public');

        $response->assertStatus(401);
        $response->assertJsonPath('error_code', 'API.KEY_INACTIVE');
    }

    #[Test]
    public function public_endpoint_fails_if_key_has_expired(): void
    {
        $this->createKey(scopes: ['settings:read'], expiresAt: now()->subMinute()->toIso8601String());

        $response = $this->withHeaders(['X-API-Key' => $this->rawKey])
            ->getJson('/api/settings/public');

        $response->assertStatus(401);
        $response->assertJsonPath('error_code', 'API.KEY_EXPIRED');
    }
}
