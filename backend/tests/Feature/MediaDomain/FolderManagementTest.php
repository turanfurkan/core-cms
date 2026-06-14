<?php

namespace Tests\Feature\MediaDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Media\Models\MediaFolder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FolderManagementTest extends TestCase
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
    public function it_can_create_a_root_folder(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/folders', [
                'name' => 'Root Folder',
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'Root Folder');
        $response->assertJsonPath('data.parent_id', null);

        $this->assertDatabaseHas('media_folders', [
            'name' => 'Root Folder',
            'parent_id' => null,
        ]);
    }

    #[Test]
    public function it_can_create_a_nested_folder(): void
    {
        $parent = MediaFolder::create(['name' => 'Parent Folder']);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/folders', [
                'name' => 'Child Folder',
                'parent_id' => $parent->id,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'Child Folder');
        $response->assertJsonPath('data.parent_id', $parent->id);

        $this->assertDatabaseHas('media_folders', [
            'name' => 'Child Folder',
            'parent_id' => $parent->id,
        ]);
    }

    #[Test]
    public function it_can_move_a_folder_to_another_parent(): void
    {
        $folder1 = MediaFolder::create(['name' => 'Folder 1']);
        $folder2 = MediaFolder::create(['name' => 'Folder 2']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/media/folders/{$folder1->id}/move", [
                'parent_id' => $folder2->id,
            ]);

        $response->assertStatus(200);
        $this->assertEquals($folder2->id, $folder1->fresh()->parent_id);
    }

    #[Test]
    public function it_prevents_circular_reference_when_moving_folders(): void
    {
        $parent = MediaFolder::create(['name' => 'Parent']);
        $child = MediaFolder::create(['name' => 'Child', 'parent_id' => $parent->id]);

        // Attempting to move Parent into Child
        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/media/folders/{$parent->id}/move", [
                'parent_id' => $child->id,
            ]);

        $response->assertStatus(422);
        $this->assertNull($parent->fresh()->parent_id);
    }

    #[Test]
    public function it_can_delete_a_folder_and_cascade_subfolders(): void
    {
        $parent = MediaFolder::create(['name' => 'Parent']);
        $child = MediaFolder::create(['name' => 'Child', 'parent_id' => $parent->id]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/media/folders/{$parent->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('media_folders', ['id' => $parent->id]);
        $this->assertDatabaseMissing('media_folders', ['id' => $child->id]);
    }
}
