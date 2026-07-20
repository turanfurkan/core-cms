<?php

namespace TuranFurkan\CoreCms\Domains\Forms\Http\Controllers\Admin;

use TuranFurkan\CoreCms\Domains\Forms\Http\Resources\FormSubmissionResource;
use TuranFurkan\CoreCms\Domains\Forms\Models\FormSubmission;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FormSubmissionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = FormSubmission::with(['form.fields']);

        if ($request->filled('form_id')) {
            $query->where('form_id', $request->input('form_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $submissions = $query->orderBy('id', 'desc')->paginate($request->input('limit', 15));

        return FormSubmissionResource::collection($submissions);
    }

    public function show(FormSubmission $submission): FormSubmissionResource
    {
        return new FormSubmissionResource($submission->load(['form.fields']));
    }

    public function updateStatus(FormSubmission $submission, Request $request): FormSubmissionResource
    {
        $request->validate([
            'status' => ['required', 'string', 'in:read,unread,spam,archived'],
        ]);

        $submission->update([
            'status' => $request->input('status'),
        ]);

        return new FormSubmissionResource($submission->load(['form.fields']));
    }

    public function destroy(FormSubmission $submission): JsonResponse
    {
        $submission->delete();

        return response()->json([
            'message' => 'Submission deleted successfully.',
        ]);
    }
}
