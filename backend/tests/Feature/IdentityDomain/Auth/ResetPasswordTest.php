<?php

namespace Tests\Feature\IdentityDomain\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/auth/password/reset';

    /** @test */
    public function it_resets_password_with_valid_token_and_revokes_sessions(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('old-password')
        ]);
        
        // Create an active session
        $user->createToken('old-session');
        $this->assertCount(1, $user->tokens);

        // Generate reset token
        $token = Password::broker()->createToken($user);

        $response = $this->patchJson(self::ENDPOINT, [
            'token' => $token,
            'email' => 'test@example.com',
            'password' => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // Verify password updated
        $this->assertTrue(Hash::check('NewPass123!', $user->refresh()->password));

        // P0: Verify all sessions revoked
        $this->assertCount(0, $user->refresh()->tokens);
    }

    /** @test */
    public function it_fails_with_invalid_token(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->patchJson(self::ENDPOINT, [
            'token' => 'invalid-token',
            'email' => 'test@example.com',
            'password' => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('status', 'error');
    }

    /** @test */
    public function it_fails_if_passwords_do_not_match(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = Password::broker()->createToken($user);

        $response = $this->patchJson(self::ENDPOINT, [
            'token' => $token,
            'email' => 'test@example.com',
            'password' => 'NewPass123!',
            'password_confirmation' => 'Different123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
