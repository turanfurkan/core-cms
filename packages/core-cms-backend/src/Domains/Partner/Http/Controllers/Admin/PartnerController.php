<?php

namespace TuranFurkan\CoreCms\Domains\Partner\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Partner\Http\Requests\StorePartnerRequest;
use TuranFurkan\CoreCms\Domains\Partner\Http\Requests\UpdatePartnerRequest;
use TuranFurkan\CoreCms\Domains\Partner\Http\Resources\PartnerResource;
use TuranFurkan\CoreCms\Domains\Partner\Models\Partner;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PartnerController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Partner::query();

        if ($request->has('category_id') && $request->query('category_id') !== 'all') {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('categories.id', $request->query('category_id'));
            });
        }

        if ($request->has('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name->tr', 'like', "%{$search}%")
                  ->orWhere('name->en', 'like', "%{$search}%");
            });
        }

        $partners = $query->with(['categories', 'logo'])
            ->orderBy('order', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return PartnerResource::collection($partners);
    }

    public function store(StorePartnerRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();
        $data['updated_by'] = auth()->id();

        $partner = Partner::create($data);

        if ($request->has('category_ids')) {
            $partner->categories()->sync($request->input('category_ids'));
        }

        return (new PartnerResource($partner->load(['categories', 'logo'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Partner $partner): PartnerResource
    {
        return new PartnerResource($partner->load(['categories', 'logo']));
    }

    public function update(UpdatePartnerRequest $request, Partner $partner): PartnerResource
    {
        $data = $request->validated();
        $data['updated_by'] = auth()->id();

        $partner->update($data);

        if ($request->has('category_ids')) {
            $partner->categories()->sync($request->input('category_ids'));
        }

        return new PartnerResource($partner->load(['categories', 'logo']));
    }

    public function destroy(Partner $partner): JsonResponse
    {
        $partner->delete();
        return response()->json(['message' => 'Partner deleted successfully.']);
    }
}
