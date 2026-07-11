<?php

namespace App\Domains\Race\Http\Controllers\Admin;

use App\Domains\Race\Http\Requests\ParticipantRequest;
use App\Domains\Race\Http\Resources\ParticipantResource;
use App\Domains\Race\Models\Participant;
use App\Domains\Race\Actions\CreateParticipantAction;
use App\Domains\Race\Actions\UpdateParticipantAction;
use App\Domains\Race\Actions\DeleteParticipantAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ParticipantController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Participant::query()->with(['user', 'registrations.race']);

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('identity_number', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%")
                  ->orWhere('club_name', 'like', "%{$search}%");
            });
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        $sortField = $request->query('sort_field', 'name');
        $sortDirection = $request->query('sort_direction', 'asc');

        // Map frontend keys to database columns
        if ($sortField === 'phone') {
            $sortField = 'phone_number';
        }

        // Validate sort field to prevent SQL injection
        $allowedFields = ['id', 'name', 'identity_number', 'phone_number', 'blood_type', 'created_at', 'updated_at'];
        if (!in_array($sortField, $allowedFields)) {
            $sortField = 'name';
        }

        $sortDirection = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'asc';

        $participants = $query->orderBy($sortField, $sortDirection)
            ->paginate($request->query('per_page', 15));

        return ParticipantResource::collection($participants);
    }

    public function store(ParticipantRequest $request, CreateParticipantAction $action): JsonResponse
    {
        $validated = $request->validated();
        $participant = $action->execute($validated);

        if ($request->filled('race_id')) {
            \App\Domains\Race\Models\Registration::create([
                'participant_id' => $participant->id,
                'race_id' => $request->input('race_id'),
                'user_id' => $participant->user_id,
                'status' => $request->input('status', 'paid') ?: 'paid',
                'certificate_status' => $request->input('certificate_status', 'approved') ?: 'approved',
                'bib_number' => $request->input('bib_number'),
                'price' => 0.00,
            ]);
        }

        return (new ParticipantResource($participant))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Participant $participant): ParticipantResource
    {
        return new ParticipantResource($participant->load('registrations.race'));
    }

    public function update(ParticipantRequest $request, Participant $participant, UpdateParticipantAction $action): ParticipantResource
    {
        $updatedParticipant = $action->execute($participant, $request->validated());

        return new ParticipantResource($updatedParticipant);
    }

    public function destroy(Participant $participant, DeleteParticipantAction $action): JsonResponse
    {
        $action->execute($participant);

        return response()->json(['message' => 'Participant profile deleted successfully.']);
    }
}
