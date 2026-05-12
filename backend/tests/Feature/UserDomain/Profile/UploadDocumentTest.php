<?php

namespace Tests\Feature\UserDomain\Profile;

use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadDocumentTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/profile/documents';

    /** @test */
    public function it_uploads_compliance_document_successfully(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $file = UploadedFile::fake()->create('id_card.pdf', 500);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'document_type' => 'id_card',
                'document' => $file
            ]);

        $response->assertStatus(200);

        // Verify media added to documents collection
        $media = $user->refresh()->getMedia('documents')->first();
        $this->assertNotNull($media);
        
        // Verify custom property
        $this->assertEquals('id_card', $media->getCustomProperty('document_type'));
    }

    /** @test */
    public function it_fails_with_invalid_document_type(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $file = UploadedFile::fake()->create('doc.pdf', 100);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson(self::ENDPOINT, [
                'document_type' => 'invalid-type',
                'document' => $file
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['document_type']);
    }
}
