<?php

namespace TuranFurkan\CoreCms\Domains\Navigation\DTOs;

use Illuminate\Http\Request;

final class NavigationData
{
    /**
     * @param NavigationItemData[] $items
     */
    public function __construct(
        public readonly string $name,
        public readonly string $key,
        public readonly bool $isActive = true,
        public readonly array $items = [],
    ) {}

    public static function fromRequest(Request $request): self
    {
        $itemsPayload = $request->input('items', []);
        $items = [];
        if (is_array($itemsPayload)) {
            foreach ($itemsPayload as $itemData) {
                if (is_array($itemData)) {
                    $items[] = NavigationItemData::fromArray($itemData);
                }
            }
        }

        return new self(
            name: (string) $request->input('name'),
            key: (string) $request->input('key'),
            isActive: $request->has('is_active') ? (bool) $request->input('is_active') : true,
            items: $items,
        );
    }

    public static function fromArray(array $payload): self
    {
        $itemsPayload = $payload['items'] ?? [];
        $items = [];
        if (is_array($itemsPayload)) {
            foreach ($itemsPayload as $itemData) {
                if (is_array($itemData)) {
                    $items[] = NavigationItemData::fromArray($itemData);
                }
            }
        }

        return new self(
            name: (string) ($payload['name'] ?? ''),
            key: (string) ($payload['key'] ?? ''),
            isActive: (bool) ($payload['is_active'] ?? true),
            items: $items,
        );
    }
}
