<?php

namespace Tests\Feature\WorkflowDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Post\Models\Post;
use App\Domains\Workflow\Models\Workflow;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WorkflowEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $editor;
    protected User $writer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->editor = User::factory()->create();
        $this->editor->assignRole('editor');

        $this->writer = User::factory()->create();
        $this->writer->assignRole('user'); // Standard user role, has no editor/admin role
    }

    #[Test]
    public function it_can_create_a_workflow_with_states_and_transitions(): void
    {
        $payload = [
            'name' => 'Editorial Approval',
            'code' => 'editorial',
            'description' => 'Standard news editorial cycle',
            'is_active' => true,
            'states' => [
                ['name' => 'Draft', 'code' => 'draft', 'is_initial' => true, 'is_final' => false],
                ['name' => 'Review', 'code' => 'review', 'is_initial' => false, 'is_final' => false],
                ['name' => 'Approved', 'code' => 'approved', 'is_initial' => false, 'is_final' => true],
            ],
            'transitions' => [
                ['name' => 'Submit', 'from_state_code' => 'draft', 'to_state_code' => 'review', 'required_role' => null],
                ['name' => 'Approve', 'from_state_code' => 'review', 'to_state_code' => 'approved', 'required_role' => 'editor'],
            ],
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/workflows', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.code', 'editorial');

        $this->assertDatabaseHas('workflows', ['code' => 'editorial']);
        $this->assertDatabaseHas('workflow_states', ['code' => 'draft', 'is_initial' => true]);
        $this->assertDatabaseHas('workflow_states', ['code' => 'approved', 'is_final' => true]);
        $this->assertDatabaseHas('workflow_transitions', ['name' => 'Submit']);
    }

    #[Test]
    public function it_can_assign_workflow_and_trigger_transitions(): void
    {
        // 1. Setup a Workflow
        $workflow = Workflow::create(['name' => 'Test', 'code' => 'test']);
        $draftState = $workflow->states()->create(['name' => 'Draft', 'code' => 'draft', 'is_initial' => true]);
        $reviewState = $workflow->states()->create(['name' => 'Review', 'code' => 'review']);
        $approvedState = $workflow->states()->create(['name' => 'Approved', 'code' => 'approved', 'is_final' => true]);

        $submitTransition = $workflow->transitions()->create([
            'name' => 'Submit',
            'from_state_id' => $draftState->id,
            'to_state_id' => $reviewState->id,
            'required_role' => null
        ]);

        $approveTransition = $workflow->transitions()->create([
            'name' => 'Approve',
            'from_state_id' => $reviewState->id,
            'to_state_id' => $approvedState->id,
            'required_role' => 'editor'
        ]);

        // 2. Create Post
        $entry = Post::create([
            'title' => ['tr' => 'Sample News', 'en' => 'Sample News'],
            'slug' => ['tr' => 'sample-news', 'en' => 'sample-news'],
            'content' => ['tr' => 'Content', 'en' => 'Content'],
            'summary' => ['tr' => 'Summary', 'en' => 'Summary'],
            'status' => 'draft'
        ]);

        // 3. Assign Workflow
        $entry->assignWorkflow($workflow);

        $this->assertEquals('draft', $entry->currentWorkflowState()->code);

        // 4. Retrieve available transitions
        $responseAvailable = $this->actingAs($this->writer)
            ->getJson("/api/admin/workflows/transitions/post/{$entry->id}");

        $responseAvailable->assertStatus(200);
        $this->assertCount(1, $responseAvailable->json());
        $this->assertEquals('Submit', $responseAvailable->json('0.name'));

        // 5. Trigger transition (Submit)
        $responseTrigger = $this->actingAs($this->writer)
            ->postJson("/api/admin/workflows/transitions/post/{$entry->id}", [
                'transition_id' => $submitTransition->id,
                'comment' => 'Submitting for editor review'
            ]);

        $responseTrigger->assertStatus(200);
        $this->assertEquals('review', $entry->fresh()->currentWorkflowState()->code);

        // Assert log entry is written
        $this->assertDatabaseHas('workflow_logs', [
            'workflowable_id' => $entry->id,
            'to_state_id' => $reviewState->id,
            'comment' => 'Submitting for editor review'
        ]);

        // 6. Test authorization restriction (Writer cannot approve)
        $responseUnauth = $this->actingAs($this->writer)
            ->postJson("/api/admin/workflows/transitions/post/{$entry->id}", [
                'transition_id' => $approveTransition->id,
            ]);

        $responseUnauth->assertStatus(422); // ValidationException from required role check
        $this->assertEquals('review', $entry->fresh()->currentWorkflowState()->code);

        // 7. Editor can approve and trigger AutoPublishWorkflowListener
        $responseApprove = $this->actingAs($this->editor)
            ->postJson("/api/admin/workflows/transitions/post/{$entry->id}", [
                'transition_id' => $approveTransition->id,
                'comment' => 'Content approved!'
            ]);

        $responseApprove->assertStatus(200);
        $this->assertEquals('approved', $entry->fresh()->currentWorkflowState()->code);

        // Assert Post is auto-published
        $this->assertEquals('published', $entry->fresh()->status);
        $this->assertNotNull($entry->fresh()->publish_date);

        // 8. History endpoint check
        $responseHistory = $this->actingAs($this->writer)
            ->getJson("/api/admin/workflows/history/post/{$entry->id}");

        $responseHistory->assertStatus(200);
        $this->assertCount(3, $responseHistory->json('data')); // initial assignment + submit + approve
        $this->assertEquals('Content approved!', $responseHistory->json('data.0.comment'));
    }
}
