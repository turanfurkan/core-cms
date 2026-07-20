<?php

namespace Tests\Feature\IdentityDomain\Auth;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/auth/password/forgot';

    /** @test */
    public function it_sends_reset_link_to_valid_user(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson(self::ENDPOINT, [
            'email' => 'test@example.com'
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }

    /** @test */
    public function it_fails_for_non_existent_email(): void
    {
        $response = $this->postJson(self::ENDPOINT, [
            'email' => 'nonexistent@example.com'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_validates_email_format(): void
    {
        $response = $this->postJson(self::ENDPOINT, [
            'email' => 'invalid-email'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
