<?php

namespace App\Domains\Settings\Http\Controllers\Public;

use App\Domains\Settings\Http\Resources\SettingResource;
use App\Domains\Settings\Models\Setting;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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
