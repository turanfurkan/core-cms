<?php

namespace Tests\Feature\SettingsDomain;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
use TuranFurkan\CoreCms\Domains\Settings\Models\Setting;
use TuranFurkan\CoreCms\Domains\Settings\Support\SettingHelper;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SettingsCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(SettingsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    #[Test]
    public function admin_can_view_settings_grouped(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/settings?group=general');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data'); // site.name, site.description, site.logo
        $response->assertJsonPath('data.0.key', 'site.description');
        $response->assertJsonPath('data.1.key', 'site.logo');
        $response->assertJsonPath('data.2.key', 'site.name');
    }

    #[Test]
    public function admin_can_bulk_update_settings(): void
    {
        SettingHelper::clearCache();

        // Check initial cache/helper value
        $this->assertEquals('CoreCMS', SettingHelper::get('site.name', null, 'tr'));

        $response = $this->actingAs($this->admin)
            ->putJson('/api/admin/settings', [
                'settings' => [
                    'site.name' => ['tr' => 'CoreCMS Yeni Ad', 'en' => 'CoreCMS New Name'],
                    'site.contact_phone' => '+90 222 222 22 22',
                    'site.maintenance_mode' => true,
                ]
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Settings updated successfully.');

        // Verify Database has updated values directly from model
        $this->assertEquals('+90 222 222 22 22', Setting::where('key', 'site.contact_phone')->first()->value);
        $this->assertTrue(Setting::where('key', 'site.maintenance_mode')->first()->value);

        // Verify SettingHelper cache is cleared and returns new values
        $this->assertEquals('CoreCMS Yeni Ad', SettingHelper::get('site.name', null, 'tr'));
        $this->assertEquals('+90 222 222 22 22', SettingHelper::get('site.contact_phone'));
        $this->assertTrue(SettingHelper::get('site.maintenance_mode'));
    }

    #[Test]
    public function public_visitor_can_retrieve_only_public_settings(): void
    {
        $response = $this->getJson('/api/settings/public');

        $response->assertStatus(200);
        
        // Assert public settings exist
        $response->assertJsonFragment(['key' => 'site.name']);
        $response->assertJsonFragment(['key' => 'site.contact_email']);
        $response->assertJsonFragment(['key' => 'site.social_links']);

        // Assert sensitive mail configuration setting is NOT public and excluded from response
        $response->assertJsonMissingExact(['key' => 'mail.host']);
        $response->assertJsonMissingExact(['key' => 'mail.username']);
        $response->assertJsonMissingExact(['key' => 'mail.password']);
    }
}
