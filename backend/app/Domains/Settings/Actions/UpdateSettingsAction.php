<?php

namespace App\Domains\Settings\Actions;

use App\Domains\Settings\Models\Setting;
use App\Domains\Settings\Support\SettingHelper;
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
