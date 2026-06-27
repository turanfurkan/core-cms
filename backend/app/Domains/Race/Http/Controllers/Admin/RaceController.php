<?php

namespace App\Domains\Race\Http\Controllers\Admin;

use App\Domains\Race\Http\Requests\RaceRequest;
use App\Domains\Race\Http\Resources\RaceResource;
use App\Domains\Race\Models\Race;
use App\Domains\Race\Actions\CreateRaceAction;
use App\Domains\Race\Actions\UpdateRaceAction;
use App\Domains\Race\Actions\DeleteRaceAction;
use App\Domains\Race\Actions\ReorderRacesAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Race::query();

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
                $q->where('title->tr', 'like', "%{$search}%")
                  ->orWhere('title->en', 'like', "%{$search}%")
                  ->orWhere('slug->tr', 'like', "%{$search}%")
                  ->orWhere('slug->en', 'like', "%{$search}%");
            });
        }

        $races = $query->with(['categories', 'childRaces', 'coverImage'])
            ->orderBy('order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return RaceResource::collection($races);
    }

    public function store(RaceRequest $request, CreateRaceAction $action): JsonResponse
    {
        $race = $action->execute($request->validated());
        
        return (new RaceResource($race->load(['categories', 'childRaces', 'coverImage'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Race $race): RaceResource
    {
        return new RaceResource(
            $race->load([
                'categories',
                'childRaces',
                'coverImage',
                'graphicImage',
                'gpxFile',
                'stravaFile'
            ])
        );
    }

    public function update(RaceRequest $request, Race $race, UpdateRaceAction $action): RaceResource
    {
        $updatedRace = $action->execute($race, $request->validated());
        
        return new RaceResource(
            $updatedRace->load([
                'categories',
                'childRaces',
                'coverImage',
                'graphicImage',
                'gpxFile',
                'stravaFile'
            ])
        );
    }

    public function destroy(Race $race, DeleteRaceAction $action): JsonResponse
    {
        $action->execute($race);
        return response()->json(['message' => 'Race deleted successfully.']);
    }

    public function reorder(Request $request, ReorderRacesAction $action): JsonResponse
    {
        $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|integer|exists:races,id',
        ]);

        $action->execute($request->input('order'));

        return response()->json(['message' => 'Races reordered successfully.']);
    }
}
