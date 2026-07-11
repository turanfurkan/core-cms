<?php

namespace App\Domains\Page\Http\Controllers\Public;

use App\Domains\Page\Http\Resources\PageResource;
use App\Domains\Page\Models\Page;
use App\Http\Controllers\Controller;

class PageController extends Controller
{
    /**
     * Get a single published page by its slug (localized).
     */
    public function show(string $slug): PageResource
    {
        if ($slug === '__homepage__') {
            $page = Page::published()
                ->where('is_homepage', true)
                ->first();

            if (!$page) {
                $page = Page::published()
                    ->where(function ($query) {
                        $query->where('slug->tr', 'anasayfa')
                              ->orWhere('slug->en', 'anasayfa')
                              ->orWhere('slug->tr', 'home')
                              ->orWhere('slug->en', 'home');
                    })
                    ->first();
            }

            if (!$page) {
                abort(404, 'Homepage not found');
            }

            return new PageResource($page->load(['coverImage', 'seo']));
        }

        $page = Page::published()
            ->where(function ($query) use ($slug) {
                $query->where('slug->tr', $slug)
                      ->orWhere('slug->en', $slug);
            })
            ->firstOrFail();

        return new PageResource($page->load(['coverImage', 'seo']));
    }
}
