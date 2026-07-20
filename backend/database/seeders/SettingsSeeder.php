<?php

namespace Database\Seeders;

use TuranFurkan\CoreCms\Domains\Settings\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'site.name',
                'value' => ['tr' => 'CoreCMS', 'en' => 'CoreCMS'],
                'type' => 'string',
                'group' => 'general',
                'is_public' => true,
            ],
            [
                'key' => 'site.description',
                'value' => ['tr' => 'CoreCMS Yönetim Paneli', 'en' => 'CoreCMS Headless Panel'],
                'type' => 'text',
                'group' => 'general',
                'is_public' => true,
            ],
            [
                'key' => 'site.logo',
                'value' => null,
                'type' => 'file',
                'group' => 'general',
                'is_public' => true,
            ],
            [
                'key' => 'site.contact_phone',
                'value' => '+90 555 555 55 55',
                'type' => 'string',
                'group' => 'contact',
                'is_public' => true,
            ],
            [
                'key' => 'site.contact_email',
                'value' => 'info@corecms.local',
                'type' => 'string',
                'group' => 'contact',
                'is_public' => true,
            ],
            [
                'key' => 'site.social_links',
                'value' => [
                    'facebook' => 'https://facebook.com/corecms',
                    'twitter' => 'https://twitter.com/corecms',
                    'instagram' => 'https://instagram.com/corecms',
                ],
                'type' => 'json',
                'group' => 'social',
                'is_public' => true,
            ],
            [
                'key' => 'site.maintenance_mode',
                'value' => false,
                'type' => 'boolean',
                'group' => 'system',
                'is_public' => true,
            ],
            [
                'key' => 'mail.host',
                'value' => 'smtp.mailtrap.io',
                'type' => 'string',
                'group' => 'mail',
                'is_public' => false,
            ],
            [
                'key' => 'mail.port',
                'value' => 2525,
                'type' => 'integer',
                'group' => 'mail',
                'is_public' => false,
            ],
            [
                'key' => 'mail.username',
                'value' => 'test-username',
                'type' => 'string',
                'group' => 'mail',
                'is_public' => false,
            ],
            [
                'key' => 'mail.password',
                'value' => 'test-password',
                'type' => 'string',
                'group' => 'mail',
                'is_public' => false,
            ],
            [
                'key' => 'frontend.system_settings',
                'value' => [
                    'name' => 'Metronic',
                    'logo' => null,
                    'active' => true,
                    'address' => '',
                    'websiteURL' => '',
                    'supportEmail' => '',
                    'supportPhone' => '',
                    'language' => 'en',
                    'timezone' => 'UTC',
                    'currency' => 'USD',
                    'currencyFormat' => '$ {value}',
                    'socialFacebook' => '',
                    'socialTwitter' => '',
                    'socialInstagram' => '',
                    'socialLinkedIn' => '',
                    'socialPinterest' => '',
                    'socialYoutube' => '',
                    'notifyStockEmail' => true,
                    'notifyStockWeb' => true,
                    'notifyStockThreshold' => 10,
                    'notifyStockRoleIds' => [],
                    'notifyNewOrderEmail' => true,
                    'notifyNewOrderWeb' => true,
                    'notifyNewOrderRoleIds' => [],
                    'notifyOrderStatusUpdateEmail' => true,
                    'notifyOrderStatusUpdateWeb' => true,
                    'notifyOrderStatusUpdateRoleIds' => [],
                    'notifyPaymentFailureEmail' => true,
                    'notifyPaymentFailureWeb' => true,
                    'notifyPaymentFailureRoleIds' => [],
                    'notifySystemErrorFailureEmail' => true,
                    'notifySystemErrorWeb' => true,
                    'notifySystemErrorRoleIds' => [],
                ],
                'type' => 'json',
                'group' => 'frontend',
                'is_public' => true,
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
