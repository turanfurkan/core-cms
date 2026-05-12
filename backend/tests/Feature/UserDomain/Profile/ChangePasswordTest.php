<?php

namespace Tests\Feature\UserDomain\Profile;

use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/profile/password';

    /** @test */
    public function it_updates_password_successfully_and_revokes_other_sessions(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password')
        ]);
        
        // Two active sessions
        $currentSession = $user->createToken('current');
        $otherSession = $user->createToken('other');

        $response = $this->withHeader('Authorization', 'Bearer ' . $currentSession->plainTextToken)
            ->patchJson(self::ENDPOINT, [
                'current_password' => 'old-password',
                'password' => 'NewPass123!',
                'password_confirmation' => 'NewPass123!',
                'logout_others' => true
            ]);

        $response->assertStatus(200);

        // Verify password updated
        $this->assertTrue(Hash::check('NewPass123!', $user->refresh()->password));

        // Verify other session revoked
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $otherSession->accessToken->id]);
        
        // Verify current session still active
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $currentSession->accessToken->id]);
    }

    /** @test */
    public function it_fails_if_current_password_is_wrong(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-one')]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson(self::ENDPOINT, [
                'current_password' => 'wrong-password',
                'password' => 'NewPass123!',
                'password_confirmation' => 'NewPass123!',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    /** @test */
    public function it_validates_new_password_strength(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old-password')]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson(self::ENDPOINT, [
                'current_password' => 'old-password',
                'password' => 'weak',
                'password_confirmation' => 'weak',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
