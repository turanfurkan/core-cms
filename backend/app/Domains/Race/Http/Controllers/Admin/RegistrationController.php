<?php

namespace App\Domains\Race\Http\Controllers\Admin;

use App\Domains\Race\Http\Requests\RegistrationRequest;
use App\Domains\Race\Http\Resources\RegistrationResource;
use App\Domains\Race\Models\Registration;
use App\Domains\Race\Actions\RegisterParticipantAction;
use App\Domains\Race\Actions\UpdateRegistrationAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RegistrationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Registration::query()->with(['participant.user', 'race', 'category']);

        if ($request->has('race_id') && $request->query('race_id') !== 'all') {
            $query->where('race_id', $request->query('race_id'));
        }

        if ($request->has('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('gender') && $request->query('gender') !== 'all') {
            $query->whereHas('participant', function ($q) use ($request) {
                $q->where('gender', $request->query('gender'));
            });
        }

        if ($request->has('t_shirt_size') && $request->query('t_shirt_size') !== 'all') {
            $query->whereHas('participant', function ($q) use ($request) {
                $q->where('t_shirt_size', $request->query('t_shirt_size'));
            });
        }

        if ($request->has('nationality') && $request->query('nationality') !== 'all') {
            $nationality = $request->query('nationality');
            $query->whereHas('participant', function ($q) use ($nationality) {
                if ($nationality === 'TR') {
                    $q->where(function ($sub) {
                        $sub->where('nationality', 'TR')
                            ->orWhere('nationality', 'Türkiye')
                            ->orWhere('nationality', 'Türkiye (TR)')
                            ->orWhereNull('nationality');
                    });
                } elseif ($nationality === 'foreign') {
                    $q->where(function ($sub) {
                        $sub->where('nationality', '!=', 'TR')
                            ->where('nationality', '!=', 'Türkiye')
                            ->where('nationality', '!=', 'Türkiye (TR)')
                            ->whereNotNull('nationality');
                    });
                } else {
                    $q->where('nationality', $nationality);
                }
            });
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('participant', function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('identity_number', 'like', "%{$search}%");
                })->orWhere('bib_number', 'like', "%{$search}%");
            });
        }

        $sortField = $request->query('sort', 'id');
        $sortDirection = $request->query('dir', 'desc');

        if ($sortField === 'participant_name') {
            $sortField = 'participant_id';
        }

        $allowedFields = ['id', 'bib_number', 'created_at', 'participant_id', 'price', 'status'];
        if (!in_array($sortField, $allowedFields)) {
            $sortField = 'id';
        }
        $sortDirection = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'desc';

        if ($sortField === 'participant_id') {
            $query->orderBy('participant_id', $sortDirection)->orderBy('id', 'desc');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        $registrations = $query->paginate($request->query('per_page', 15));

        return RegistrationResource::collection($registrations);
    }

    public function store(RegistrationRequest $request, RegisterParticipantAction $action): JsonResponse
    {
        $registration = $action->execute($request->validated());

        return (new RegistrationResource($registration->load(['participant.user', 'race', 'category'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Registration $registration): RegistrationResource
    {
        return new RegistrationResource($registration->load(['participant.user', 'race', 'category']));
    }

    public function update(RegistrationRequest $request, Registration $registration, UpdateRegistrationAction $action): RegistrationResource
    {
        $updatedRegistration = $action->execute($registration, $request->validated());

        return new RegistrationResource($updatedRegistration->load(['participant.user', 'race', 'category']));
    }

    public function destroy(Registration $registration): JsonResponse
    {
        $registration->delete();

        return response()->json(['message' => 'Registration deleted successfully.']);
    }
}
