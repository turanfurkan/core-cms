<?php

namespace TuranFurkan\CoreCms\Domains\Settings\Actions;

use TuranFurkan\CoreCms\Domains\Settings\Models\Setting;
use TuranFurkan\CoreCms\Domains\Settings\Support\SettingHelper;
use Illuminate\Support\Facades\DB;

class UpdateSettingsAction
{
    public function execute(array $settings): void
    {
        DB::transaction(function () use ($settings) {
            foreach ($settings as $key => $value) {
                $setting = Setting::where('key', $key)->first();
                if ($setting) {
                    $setting->update(['value' => $value]);
                }
            }
        });

        SettingHelper::clearCache();
    }
}
