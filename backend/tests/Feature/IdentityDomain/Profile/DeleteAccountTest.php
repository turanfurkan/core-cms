<?php

namespace Tests\Feature\IdentityDomain\Profile;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DeleteAccountTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/profile';

    /** @test */
    public function it_soft_deletes_account_after_password_confirmation(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret-password')
        ]);
        $token = $user->createToken('test-session')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson(self::ENDPOINT, [
                'password' => 'secret-password'
            ]);

        $response->assertStatus(200);

        // Verify still in DB (Soft Delete)
        $this->assertDatabaseHas('users', ['id' => $user->id]);
        
        // Verify deleted_at is set
        $this->assertNotNull($user->refresh()->deleted_at);

        // Verify tokens are revoked
        $this->assertCount(0, $user->tokens);
    }

    /** @test */
    public function it_fails_if_password_is_incorrect(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-one')]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson(self::ENDPOINT, [
                'password' => 'wrong-password'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
