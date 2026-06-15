<?php

namespace App\Domains\Settings\Http\Controllers\Admin;

use App\Domains\Settings\Actions\UpdateSettingsAction;
use App\Domains\Settings\Http\Requests\SettingsRequest;
use App\Domains\Settings\Http\Resources\SettingResource;
use App\Domains\Settings\Models\Setting;
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
