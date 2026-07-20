<?php

namespace TuranFurkan\CoreCms\Domains\Settings\Http\Controllers;

use TuranFurkan\CoreCms\Domains\Settings\Http\Resources\SettingResource;
use TuranFurkan\CoreCms\Domains\Settings\Models\Setting;
use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicSettingsController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $settings = Setting::where('is_public', true)
            ->orderBy('key', 'asc')
            ->get();

        return SettingResource::collection($settings);
    }
}
