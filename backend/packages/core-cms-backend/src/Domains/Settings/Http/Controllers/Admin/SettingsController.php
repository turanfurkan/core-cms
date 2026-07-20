<?php

namespace TuranFurkan\CoreCms\Domains\Settings\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Settings\Actions\UpdateSettingsAction;
use TuranFurkan\CoreCms\Domains\Settings\Http\Requests\SettingsRequest;
use TuranFurkan\CoreCms\Domains\Settings\Http\Resources\SettingResource;
use TuranFurkan\CoreCms\Domains\Settings\Models\Setting;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SettingsController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Setting::query();

        if ($request->filled('group')) {
            $query->where('group', $request->input('group'));
        }

        $settings = $query->orderBy('key', 'asc')->get();

        return SettingResource::collection($settings);
    }

    public function update(SettingsRequest $request, UpdateSettingsAction $action): JsonResponse
    {
        $action->execute($request->input('settings'));

        return response()->json([
            'message' => 'Settings updated successfully.',
        ]);
    }
}
