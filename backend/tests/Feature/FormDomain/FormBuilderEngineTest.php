<?php

namespace Tests\Feature\FormDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Forms\Models\Form;
use App\Domains\Forms\Models\FormSubmission;
use App\Domains\Forms\Events\FormSubmitted;
use App\Domains\Forms\Mail\FormSubmissionAlert;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FormBuilderEngineTest extends TestCase
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
    public function admin_can_manage_forms_and_fields(): void
    {
        // 1. Create Form
        $response1 = $this->actingAs($this->admin)
            ->postJson('/api/admin/forms', [
                'title' => 'Contact Form',
                'slug' => 'contact-form',
                'description' => 'A generic contact form',
                'recipient_email' => 'admin@corecms.com',
                'settings' => ['success_message' => 'Thanks!'],
                'is_active' => true,
                'fields' => [
                    [
                        'type' => 'text',
                        'name' => 'fullname',
                        'label' => 'Full Name',
                        'placeholder' => 'John Doe',
                        'is_required' => true,
                        'order' => 1,
                    ],
                    [
                        'type' => 'email',
                        'name' => 'email_address',
                        'label' => 'Email Address',
                        'is_required' => true,
                        'order' => 2,
                    ]
                ]
            ]);

        $response1->assertStatus(201);
        $response1->assertJsonPath('data.title', 'Contact Form');
        $this->assertDatabaseHas('forms', ['slug' => 'contact-form']);
        $this->assertDatabaseHas('form_fields', ['name' => 'fullname', 'is_required' => true]);

        $formId = $response1->json('data.id');

        // 2. Update Form & Sync Fields
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/forms/{$formId}", [
                'title' => 'Contact Form Updated',
                'slug' => 'contact-form-updated',
                'description' => 'Updated desc',
                'recipient_email' => 'alerts@corecms.com',
                'settings' => ['success_message' => 'Thank you so much!'],
                'is_active' => true,
                'fields' => [
                    [
                        'type' => 'text',
                        'name' => 'fullname',
                        'label' => 'Full Name Updated',
                        'is_required' => false,
                        'order' => 1,
                    ],
                    [
                        'type' => 'number',
                        'name' => 'phone_number',
                        'label' => 'Phone Number',
                        'is_required' => true,
                        'order' => 2,
                    ]
                ]
            ]);

        $responseUpdate->assertStatus(200);
        $this->assertDatabaseHas('forms', ['title' => 'Contact Form Updated', 'slug' => 'contact-form-updated']);
        $this->assertDatabaseMissing('form_fields', ['name' => 'email_address']);
        $this->assertDatabaseHas('form_fields', ['name' => 'fullname', 'label' => 'Full Name Updated', 'is_required' => false]);
        $this->assertDatabaseHas('form_fields', ['name' => 'phone_number', 'type' => 'number', 'is_required' => true]);

        // 3. Delete Form
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/forms/{$formId}");

        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('forms', ['id' => $formId]);
        $this->assertDatabaseMissing('form_fields', ['form_id' => $formId]);
    }

    #[Test]
    public function dynamic_validation_and_successful_submission(): void
    {
        Event::fake([FormSubmitted::class]);
        Mail::fake();

        $form = Form::create([
            'title' => 'Feedback Form',
            'slug' => 'feedback',
            'recipient_email' => 'feedback@corecms.com',
            'is_active' => true,
        ]);

        $form->fields()->create([
            'type' => 'text',
            'name' => 'user_name',
            'label' => 'Name',
            'is_required' => true,
        ]);

        $form->fields()->create([
            'type' => 'email',
            'name' => 'user_email',
            'label' => 'Email',
            'is_required' => true,
        ]);

        $form->fields()->create([
            'type' => 'number',
            'name' => 'rating',
            'label' => 'Rating',
            'is_required' => false,
        ]);

        // 1. Submit with invalid rating (not a number)
        $responseInvalid = $this->postJson("/api/forms/{$form->slug}/submit", [
            'user_name' => 'Jane Doe',
            'user_email' => 'jane@example.com',
            'rating' => 'excellent',
        ]);
        $responseInvalid->assertStatus(422);
        $responseInvalid->assertJsonValidationErrors(['rating']);

        // 2. Submit with missing required fields
        $responseMissing = $this->postJson("/api/forms/{$form->slug}/submit", [
            'user_email' => 'jane@example.com',
        ]);
        $responseMissing->assertStatus(422);
        $responseMissing->assertJsonValidationErrors(['user_name']);

        // 3. Submit successfully
        $responseSuccess = $this->postJson("/api/forms/{$form->slug}/submit", [
            'user_name' => 'Jane Doe',
            'user_email' => 'jane@example.com',
            'rating' => 5,
        ]);

        $responseSuccess->assertStatus(200);
        $responseSuccess->assertJsonPath('message', 'Mesajınız başarıyla gönderildi.');

        $this->assertDatabaseHas('form_submissions', [
            'form_id' => $form->id,
            'status' => 'unread',
        ]);

        $submission = FormSubmission::first();
        $this->assertEquals('Jane Doe', $submission->data['user_name']);
        $this->assertEquals(5, $submission->data['rating']);

        Event::assertDispatched(FormSubmitted::class, function ($event) use ($submission) {
            return $event->submission->id === $submission->id;
        });

        // Trigger listener manually since Event::fake prevents it
        $listener = new \App\Domains\Forms\Listeners\SendFormSubmissionAlert();
        $listener->handle(new FormSubmitted($submission));

        Mail::assertSent(FormSubmissionAlert::class, function ($mail) use ($submission) {
            return $mail->hasTo('feedback@corecms.com') && $mail->submission->id === $submission->id;
        });
    }

    #[Test]
    public function honeypot_detection_saves_as_spam_and_skips_alerts(): void
    {
        Event::fake([FormSubmitted::class]);

        $form = Form::create([
            'title' => 'Spam Test',
            'slug' => 'spam-test',
            'recipient_email' => 'spam@corecms.com',
            'settings' => ['honeypot_field' => 'website'],
            'is_active' => true,
        ]);

        $form->fields()->create([
            'type' => 'text',
            'name' => 'message',
            'label' => 'Message',
            'is_required' => true,
        ]);

        // Submit with honeypot field filled
        $response = $this->postJson("/api/forms/{$form->slug}/submit", [
            'message' => 'Buy my stuff',
            'website' => 'http://spambot.com', // Honeypot filled!
        ]);

        $response->assertStatus(200); // Tricked bot with 200 success

        $this->assertDatabaseHas('form_submissions', [
            'form_id' => $form->id,
            'status' => 'spam',
        ]);

        $submission = FormSubmission::first();
        $this->assertEquals('Buy my stuff', $submission->data['message']);

        // Assert that the FormSubmitted event was NEVER dispatched
        Event::assertNotDispatched(FormSubmitted::class);
    }

    #[Test]
    public function file_attachments_are_uploaded_and_recorded(): void
    {
        Storage::fake('public');

        $form = Form::create([
            'title' => 'Job Application',
            'slug' => 'apply',
            'is_active' => true,
        ]);

        $form->fields()->create([
            'type' => 'file',
            'name' => 'cv_file',
            'label' => 'Resume',
            'is_required' => true,
        ]);

        $file = UploadedFile::fake()->create('my_resume.pdf', 500); // 500 KB

        $response = $this->postJson("/api/forms/{$form->slug}/submit", [
            'cv_file' => $file,
        ]);

        $response->assertStatus(200);

        $submission = FormSubmission::first();
        $fileData = $submission->data['cv_file'];

        $this->assertEquals('my_resume.pdf', $fileData['original_name']);
        Storage::disk('public')->assertExists($fileData['path']);
    }
}
