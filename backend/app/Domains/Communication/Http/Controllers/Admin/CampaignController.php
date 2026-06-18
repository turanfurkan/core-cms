<?php

namespace App\Domains\Communication\Http\Controllers\Admin;

use App\Domains\Communication\Actions\CreateCampaignAction;
use App\Domains\Communication\Actions\SendCampaignAction;
use App\Domains\Communication\DTOs\CampaignData;
use App\Domains\Communication\Http\Requests\CampaignRequest;
use App\Domains\Communication\Http\Resources\CampaignResource;
use App\Domains\Communication\Models\Campaign;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CampaignController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $campaigns = Campaign::orderBy('id', 'desc')->paginate($request->input('limit', 15));

        return CampaignResource::collection($campaigns);
    }

    public function store(CampaignRequest $request, CreateCampaignAction $action): CampaignResource
    {
        $dto = CampaignData::fromRequest($request);
        $campaign = $action->execute($dto);

        return new CampaignResource($campaign);
    }

    public function show(Campaign $campaign): CampaignResource
    {
        return new CampaignResource($campaign);
    }

    public function send(Campaign $campaign, SendCampaignAction $action): CampaignResource
    {
        $updated = $action->execute($campaign);

        return new CampaignResource($updated);
    }

    public function destroy(Campaign $campaign): JsonResponse
    {
        if ($campaign->status === 'sending') {
            return response()->json([
                'message' => 'Cannot delete a campaign that is actively sending.',
            ], 422);
        }

        $campaign->delete();

        return response()->json([
            'message' => 'Campaign deleted successfully.',
        ]);
    }
}
