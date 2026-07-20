<?php

namespace Tests\Feature\LocalizationDomain;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Localization\Models\Language;
use TuranFurkan\CoreCms\Domains\Localization\Models\Translation;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LocalizationEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        // Clear all cached translation items before each test
        Cache::clear();
    }

    #[Test]
    public function it_can_manage_languages_and_enforce_defaults(): void
    {
        // 1. Create first language, should automatically become the default
        $response1 = $this->actingAs($this->admin)
            ->postJson('/api/admin/languages', [
                'name' => 'Turkish',
                'code' => 'tr',
                'is_default' => false,
                'is_active' => true,
            ]);

        $response1->assertStatus(201);
        $response1->assertJsonPath('data.is_default', true);

        // 2. Create second language, set as default
        $response2 = $this->actingAs($this->admin)
            ->postJson('/api/admin/languages', [
                'name' => 'English',
                'code' => 'en',
                'is_default' => true,
                'is_active' => true,
            ]);

        $response2->assertStatus(201);
        $response2->assertJsonPath('data.is_default', true);

        // Assert that the first language (tr) is no longer default
        $this->assertFalse(Language::where('code', 'tr')->first()->is_default);

        // 3. Update tr to default again
        $tr = Language::where('code', 'tr')->first();
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/languages/{$tr->id}", [
                'name' => 'Turkish Updated',
                'code' => 'tr',
                'is_default' => true,
                'is_active' => true,
            ]);

        $responseUpdate->assertStatus(200);
        $this->assertTrue($tr->fresh()->is_default);
        $this->assertFalse(Language::where('code', 'en')->first()->is_default);

        // 4. Try to delete the default language, should fail with 422
        $responseDeleteDefault = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/languages/{$tr->id}");

        $responseDeleteDefault->assertStatus(422);
        $this->assertDatabaseHas('languages', ['id' => $tr->id]);

        // 5. Delete non-default language (en), should succeed
        $en = Language::where('code', 'en')->first();
        $responseDeleteNonDefault = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/languages/{$en->id}");

        $responseDeleteNonDefault->assertStatus(200);
        $this->assertDatabaseMissing('languages', ['id' => $en->id]);
    }

    #[Test]
    public function middleware_can_auto_detect_and_set_locale(): void
    {
        Language::create(['name' => 'Turkish', 'code' => 'tr', 'is_default' => true, 'is_active' => true]);
        Language::create(['name' => 'English', 'code' => 'en', 'is_default' => false, 'is_active' => true]);

        // 1. Send request with ?locale=en query parameter
        $this->getJson('/api/health?locale=en');
        $this->assertEquals('en', app()->getLocale());

        // 2. Send request with X-Locale header
        $this->getJson('/api/health', ['X-Locale' => 'tr']);
        $this->assertEquals('tr', app()->getLocale());

        // 3. Try setting an inactive or invalid locale, should fallback to default (tr)
        $this->getJson('/api/health?locale=de');
        $this->assertEquals('tr', app()->getLocale());
    }

    #[Test]
    public function database_translation_loader_overrides_file_translations_and_manages_cache(): void
    {
        Language::create(['name' => 'Turkish', 'code' => 'tr', 'is_default' => true, 'is_active' => true]);
        Language::create(['name' => 'English', 'code' => 'en', 'is_default' => false, 'is_active' => true]);

        // Define a translation in the database
        Translation::create([
            'group' => 'messages',
            'key' => 'welcome',
            'text' => [
                'tr' => 'Veritabanı Hoş Geldiniz!',
                'en' => 'Database Welcome!',
            ],
        ]);

        // Test English locale
        app()->setLocale('en');
        $this->assertEquals('Database Welcome!', __('messages.welcome'));

        // Test Turkish locale
        app()->setLocale('tr');
        $this->assertEquals('Veritabanı Hoş Geldiniz!', __('messages.welcome'));

        // Update translation value
        $this->actingAs($this->admin)
            ->postJson('/api/admin/translations', [
                'group' => 'messages',
                'key' => 'welcome',
                'text' => [
                    'tr' => 'Güncel Hoş Geldiniz!',
                    'en' => 'Updated Welcome!',
                ],
            ]);

        // Clear translator memory cache in testing environment
        $this->app->forgetInstance('translator');

        // Check if cache was cleared and new translation loaded
        app()->setLocale('tr');
        $this->assertEquals('Güncel Hoş Geldiniz!', __('messages.welcome'));

        app()->setLocale('en');
        $this->assertEquals('Updated Welcome!', __('messages.welcome'));
    }
}
