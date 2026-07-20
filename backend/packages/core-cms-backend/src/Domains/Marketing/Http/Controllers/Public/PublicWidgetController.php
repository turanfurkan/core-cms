<?php

namespace TuranFurkan\CoreCms\Domains\Marketing\Http\Controllers\Public;

use TuranFurkan\CoreCms\Domains\Marketing\Http\Resources\WidgetResource;
use TuranFurkan\CoreCms\Domains\Marketing\Models\MarketingWidget;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PublicWidgetController extends Controller
{
    public function show(string $key): WidgetResource
    {
        $widget = MarketingWidget::where('key', $key)
            ->where('is_active', true)
            ->firstOrFail();

        return new WidgetResource($widget);
    }
}
