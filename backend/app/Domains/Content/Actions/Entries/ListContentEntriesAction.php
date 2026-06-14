<?php

namespace App\Domains\Content\Actions\Entries;

use App\Domains\Content\Models\ContentType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListContentEntriesAction
{
    public function execute(
        ContentType $contentType,
        array $filters = [],
        ?string $status = null,
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = $contentType->entries();

        if ($status !== null) {
            $query->where('status', $status);
        }

        // Apply dynamic JSON filters based on content field slugs
        foreach ($filters as $key => $value) {
            if ($value !== null && $value !== '') {
                if (is_numeric($value)) {
                    $value = (int) $value == $value ? (int) $value : (float) $value;
                }

                // If it is an array (e.g. multi-select or tags list check)
                if (is_array($value)) {
                    $query->whereJsonContains("data->{$key}", $value);
                } else {
                    $query->where("data->{$key}", $value);
                }
            }
        }

        return $query->paginate($perPage);
    }
}
