<?php

namespace App\Domains\Navigation\DTOs;

final class NavigationItemData
{
    /**
     * @param NavigationItemData[] $children
     */
    public function __construct(
        public readonly array $title,
        public readonly string $type = 'custom',
        public readonly ?string $url = null,
        public readonly ?string $linkedResourceType = null,
        public readonly ?int $linkedResourceId = null,
        public readonly string $target = '_self',
        public readonly bool $isActive = true,
        public readonly array $children = [],
    ) {}

    public static function fromArray(array $payload): self
    {
        $childrenPayload = $payload['children'] ?? [];
        $children = [];
        if (is_array($childrenPayload)) {
            foreach ($childrenPayload as $childData) {
                if (is_array($childData)) {
                    $children[] = self::fromArray($childData);
                }
            }
        }

        return new self(
            title: is_array($payload['title'] ?? null) ? $payload['title'] : ['tr' => (string) ($payload['title'] ?? '')],
            type: (string) ($payload['type'] ?? 'custom'),
            url: $payload['url'] ?? null,
            linkedResourceType: $payload['linked_resource_type'] ?? null,
            linkedResourceId: isset($payload['linked_resource_id']) ? (int) $payload['linked_resource_id'] : null,
            target: (string) ($payload['target'] ?? '_self'),
            isActive: (bool) ($payload['is_active'] ?? true),
            children: $children,
        );
    }
}
