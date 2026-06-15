<?php

namespace App\Domains\Navigation\Actions;

use App\Domains\Navigation\DTOs\NavigationData;
use App\Domains\Navigation\Models\Navigation;
use App\Domains\Navigation\Models\NavigationItem;
use Illuminate\Support\Facades\DB;

class CreateNavigationAction
{
    public function execute(NavigationData $dto): Navigation
    {
        return DB::transaction(function () use ($dto) {
            $navigation = Navigation::create([
                'name' => $dto->name,
                'key' => $dto->key,
                'is_active' => $dto->isActive,
            ]);

            $this->saveItems($dto->items, $navigation->id);

            return $navigation;
        });
    }

    protected function saveItems(array $items, int $navigationId, ?int $parentId = null): void
    {
        foreach ($items as $index => $itemDto) {
            $item = NavigationItem::create([
                'navigation_id' => $navigationId,
                'parent_id' => $parentId,
                'title' => $itemDto->title,
                'type' => $itemDto->type,
                'url' => $itemDto->url,
                'linked_resource_type' => $itemDto->linkedResourceType,
                'linked_resource_id' => $itemDto->linkedResourceId,
                'target' => $itemDto->target,
                'order' => $index,
                'is_active' => $itemDto->isActive,
            ]);

            if (!empty($itemDto->children)) {
                $this->saveItems($itemDto->children, $navigationId, $item->id);
            }
        }
    }
}
