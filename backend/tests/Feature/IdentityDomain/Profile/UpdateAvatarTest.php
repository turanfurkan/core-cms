<?php

namespace Tests\Feature\IdentityDomain\Profile;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UpdateAvatarTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/profile/avatar';

    /** @test */
    public function it_uploads_avatar_successfully(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'avatar' => $file
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'avatar_url']);

        // Verify media added to Spatie collection
        $this->assertCount(1, $user->refresh()->getMedia('avatar'));
    }

    /** @test */
    public function it_fails_if_no_avatar_provided(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    }

    /** @test */
    public function it_validates_file_is_an_image(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $file = UploadedFile::fake()->create('not-image.pdf', 100);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'avatar' => $file
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['avatar']);
    }
}
