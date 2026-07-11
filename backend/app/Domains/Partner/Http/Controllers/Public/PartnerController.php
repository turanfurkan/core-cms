<?php

namespace App\Domains\Partner\Http\Controllers\Public;

use App\Domains\Partner\Http\Resources\PartnerResource;
use App\Domains\Partner\Models\Partner;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PartnerController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Partner::query()->where('status', 'published');

        if ($request->has('category_slug')) {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('slug->tr', $request->query('category_slug'))
                  ->orWhere('slug->en', $request->query('category_slug'));
            });
        }

        $partners = $query->with(['categories', 'logo'])
            ->orderBy('order', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return PartnerResource::collection($partners);
    }
}
