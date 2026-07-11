<?php

namespace App\Domains\GlobalBlock\Http\Controllers\Admin;

use App\Domains\GlobalBlock\Http\Requests\GlobalBlockRequest;
use App\Domains\GlobalBlock\Http\Resources\GlobalBlockResource;
use App\Domains\GlobalBlock\Models\GlobalBlock;
use App\Http\Controllers\Controller;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class GlobalBlockController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $blocks = GlobalBlock::orderBy('name')->get();
        return GlobalBlockResource::collection($blocks);
    }

    public function store(GlobalBlockRequest $request): GlobalBlockResource
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();
        $data['updated_by'] = auth()->id();

        $block = GlobalBlock::create($data);

        return new GlobalBlockResource($block);
    }

    public function show(GlobalBlock $globalBlock): GlobalBlockResource
    {
        return new GlobalBlockResource($globalBlock);
    }

    public function update(GlobalBlockRequest $request, GlobalBlock $globalBlock): GlobalBlockResource
    {
        $data = $request->validated();
        $data['updated_by'] = auth()->id();

        $globalBlock->update($data);

        return new GlobalBlockResource($globalBlock);
    }

    public function destroy(GlobalBlock $globalBlock): \Illuminate\Http\JsonResponse
    {
        $globalBlock->delete();
        return response()->json(['message' => 'Global şablon başarıyla silindi.']);
    }
}
