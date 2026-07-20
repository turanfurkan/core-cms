<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Marketing\Actions\CreateWidgetAction;
use TuranFurkan\CoreCms\Domains\Marketing\Actions\UpdateWidgetAction;
use TuranFurkan\CoreCms\Domains\Marketing\DTOs\WidgetData;
use TuranFurkan\CoreCms\Domains\Marketing\Http\Requests\WidgetRequest;
use TuranFurkan\CoreCms\Domains\Marketing\Http\Resources\WidgetResource;
use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingWidget;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminWidgetController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $widgets = MarketingWidget::orderBy('id', 'desc')->paginate($request->input('limit', 15));

        return WidgetResource::collection($widgets);
    }

    public function store(WidgetRequest $request, CreateWidgetAction $action): WidgetResource
    {
        $dto = WidgetData::fromRequest($request);
        $widget = $action->execute($dto);

        return new WidgetResource($widget);
    }

    public function show(MarketingWidget $widget): WidgetResource
    {
        return new WidgetResource($widget);
    }

    public function update(MarketingWidget $widget, WidgetRequest $request, UpdateWidgetAction $action): WidgetResource
    {
        $dto = WidgetData::fromRequest($request);
        $updated = $action->execute($widget, $dto);

        return new WidgetResource($updated);
    }

    public function destroy(MarketingWidget $widget): JsonResponse
    {
        $widget->delete();

        return response()->json([
            'message' => 'Widget deleted successfully.',
        ]);
    }
}
