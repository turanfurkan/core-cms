<?php

namespace Tests\Feature\UserDomain\Profile;

use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserConsentTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/profile/consents';

    /** @test */
    public function it_records_user_consent_successfully(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'consent_type' => 'kvkk',
                'version' => 'v1.0'
            ]);

        $response->assertStatus(200);

        // Verify recorded in DB
        $this->assertDatabaseHas('consent_logs', [
            'user_id' => $user->id,
            'consent_type' => 'kvkk',
            'version' => 'v1.0'
        ]);
    }

    /** @test */
    public function it_fails_with_invalid_consent_type(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'consent_type' => 'invalid-type',
                'version' => 'v1.0'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['consent_type']);
    }
}
