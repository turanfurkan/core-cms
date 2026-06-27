<?php

namespace App\Domains\Race\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|array',
            'title.tr' => 'required|string|max:191',
            'title.en' => 'nullable|string|max:191',
            'slug' => 'required|array',
            'slug.tr' => 'required|string|max:191',
            'slug.en' => 'nullable|string|max:191',
            'content' => 'nullable|array',
            'content.tr' => 'nullable|string',
            'content.en' => 'nullable|string',
            'start_date' => 'required|date',
            'start_time' => 'nullable|string',
            'location_embed' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discounted_price' => 'nullable|numeric|min:0',
            'registration_deadline' => 'required|date',
            'max_participants' => 'required|integer|min:0',
            'distance' => 'nullable|string|max:100',
            'start_point' => 'nullable|string|max:191',
            'finish_point' => 'nullable|string|max:191',
            'elevation' => 'nullable|string|max:100',
            'descent' => 'nullable|string|max:100',
            'cover_image_id' => 'nullable|integer',
            'graphic_image_id' => 'nullable|integer',
            'gpx_file_id' => 'nullable|integer',
            'strava_file_id' => 'nullable|integer',
            'gallery_ids' => 'nullable|array',
            'gallery_ids.*' => 'integer',
            'youtube_embed' => 'nullable|string|max:255',
            'is_multi_race' => 'nullable|boolean',
            'manager_name' => 'nullable|string|max:191',
            'manager_phone' => 'nullable|string|max:100',
            'is_sales_active' => 'nullable|boolean',
            'contest_id' => 'nullable|integer',
            'is_free' => 'nullable|boolean',
            'order' => 'nullable|integer',
            'status' => 'nullable|string|in:draft,published,archived',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer|exists:categories,id',
            'child_race_ids' => 'nullable|array',
            'child_race_ids.*' => 'integer|exists:races,id',
            'tabs' => 'nullable|array',
            'min_age' => 'nullable|integer|min:0',
            'max_age' => 'nullable|integer|min:0',
        ];
    }
}
