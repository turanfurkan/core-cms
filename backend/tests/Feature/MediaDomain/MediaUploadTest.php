<?php

namespace Tests\Feature\MediaDomain;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaFolder;
use TuranFurkan\CoreCms\Domains\Media\Models\MediaItem;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class MediaUploadTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        // Fake the public storage disk so uploaded files don't touch actual disk
        Storage::fake('public');
    }

    #[Test]
    public function it_can_upload_a_file_to_the_root_directory(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/files', [
                'file' => $file,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'avatar');
        $response->assertJsonPath('data.file_name', 'avatar.jpg');
        $response->assertJsonPath('data.folder_id', null);

        $mediaId = $response->json('data.id');

        // Check if the file was saved to storage faked disk
        Storage::disk('public')->assertExists("{$mediaId}/avatar.jpg");

        // WebP conversion checks
        Storage::disk('public')->assertExists("{$mediaId}/conversions/avatar-webp.webp");
    }

    #[Test]
    public function it_can_upload_a_file_to_a_specific_folder(): void
    {
        $folder = MediaFolder::create(['name' => 'Assets']);
        $file = UploadedFile::fake()->image('logo.png');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/files', [
                'file' => $file,
                'folder_id' => $folder->id,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'logo');
        $response->assertJsonPath('data.folder_id', $folder->id);

        $mediaId = $response->json('data.id');

        Storage::disk('public')->assertExists("{$mediaId}/logo.png");
        Storage::disk('public')->assertExists("{$mediaId}/conversions/logo-webp.webp");
    }

    #[Test]
    public function it_can_list_files_under_a_folder(): void
    {
        $folder = MediaFolder::create(['name' => 'Photos']);
        
        $file1 = UploadedFile::fake()->image('image1.png');
        $file2 = UploadedFile::fake()->image('image2.png');

        // Upload one file to root and one to the folder
        $this->actingAs($this->admin)
            ->postJson('/api/admin/media/files', [
                'file' => $file1,
            ]);

        $this->actingAs($this->admin)
            ->postJson('/api/admin/media/files', [
                'file' => $file2,
                'folder_id' => $folder->id,
            ]);

        // List root files
        $responseRoot = $this->actingAs($this->admin)
            ->getJson('/api/admin/media/files?folder_id=root');

        $responseRoot->assertStatus(200);
        $this->assertCount(1, $responseRoot->json('data'));
        $this->assertEquals('image1', $responseRoot->json('data.0.name'));

        // List folder files
        $responseFolder = $this->actingAs($this->admin)
            ->getJson("/api/admin/media/files?folder_id={$folder->id}");

        $responseFolder->assertStatus(200);
        $this->assertCount(1, $responseFolder->json('data'));
        $this->assertEquals('image2', $responseFolder->json('data.0.name'));
    }

    #[Test]
    public function it_can_update_file_seo_metadata(): void
    {
        $file = UploadedFile::fake()->image('banner.png');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/files', [
                'file' => $file,
            ]);

        $mediaId = $response->json('data.id');

        $responseMeta = $this->actingAs($this->admin)
            ->putJson("/api/admin/media/files/{$mediaId}/meta", [
                'alt_text' => 'Beautiful Banner Alt Text',
                'title' => 'Banner Title',
                'description' => 'Banner description SEO focus',
                'caption' => 'Captivating Caption',
            ]);

        $responseMeta->assertStatus(200);
        $responseMeta->assertJsonPath('data.metadata.alt_text', 'Beautiful Banner Alt Text');
        $responseMeta->assertJsonPath('data.metadata.title', 'Banner Title');
        $responseMeta->assertJsonPath('data.metadata.description', 'Banner description SEO focus');
        $responseMeta->assertJsonPath('data.metadata.caption', 'Captivating Caption');

        // Re-fetch model and check custom properties directly
        $mediaItem = MediaItem::find($mediaId);
        $this->assertEquals('Beautiful Banner Alt Text', $mediaItem->getAltText());
        $this->assertEquals('Banner Title', $mediaItem->getTitle());
    }

    #[Test]
    public function it_can_move_a_file_to_another_folder(): void
    {
        $folder = MediaFolder::create(['name' => 'Icons']);
        $file = UploadedFile::fake()->image('icon.png');

        $responseUpload = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/files', [
                'file' => $file,
            ]);

        $mediaId = $responseUpload->json('data.id');
        $this->assertNull($responseUpload->json('data.folder_id'));

        $responseMove = $this->actingAs($this->admin)
            ->postJson("/api/admin/media/files/{$mediaId}/move", [
                'folder_id' => $folder->id,
            ]);

        $responseMove->assertStatus(200);
        $responseMove->assertJsonPath('data.folder_id', $folder->id);
    }

    #[Test]
    public function it_can_delete_a_file_from_database_and_disk(): void
    {
        $file = UploadedFile::fake()->image('delete_me.png');

        $responseUpload = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/files', [
                'file' => $file,
            ]);

        $mediaId = $responseUpload->json('data.id');

        Storage::disk('public')->assertExists("{$mediaId}/delete_me.png");

        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/media/files/{$mediaId}");

        $responseDelete->assertStatus(200);

        // Assert missing from db
        $this->assertDatabaseMissing('media', ['id' => $mediaId]);

        // Assert missing from storage disk
        Storage::disk('public')->assertMissing("{$mediaId}/delete_me.png");
    }
}
