<?php

namespace TuranFurkan\CoreCms\Domains\Forms\DTOs;

use Illuminate\Http\Request;

final class FormData
{
    /**
     * @param FormFieldData[] $fields
     */
    public function __construct(
        public readonly string $title,
        public readonly string $slug,
        public readonly ?string $description = null,
        public readonly ?string $recipientEmail = null,
        public readonly array $settings = [],
        public readonly bool $isActive = true,
        public readonly array $fields = [],
    ) {}

    public static function fromRequest(Request $request): self
    {
        $fieldsPayload = $request->input('fields', []);
        $fields = [];
        if (is_array($fieldsPayload)) {
            foreach ($fieldsPayload as $fieldData) {
                if (is_array($fieldData)) {
                    $fields[] = FormFieldData::fromArray($fieldData);
                }
            }
        }

        return new self(
            title: (string) $request->input('title'),
            slug: (string) $request->input('slug'),
            description: $request->filled('description') ? (string) $request->input('description') : null,
            recipientEmail: $request->filled('recipient_email') ? (string) $request->input('recipient_email') : null,
            settings: is_array($request->input('settings')) ? $request->input('settings') : [],
            isActive: $request->has('is_active') ? (bool) $request->input('is_active') : true,
            fields: $fields,
        );
    }

    public static function fromArray(array $payload): self
    {
        $fieldsPayload = $payload['fields'] ?? [];
        $fields = [];
        if (is_array($fieldsPayload)) {
            foreach ($fieldsPayload as $fieldData) {
                if (is_array($fieldData)) {
                    $fields[] = FormFieldData::fromArray($fieldData);
                }
            }
        }

        return new self(
            title: (string) ($payload['title'] ?? ''),
            slug: (string) ($payload['slug'] ?? ''),
            description: $payload['description'] ?? null,
            recipientEmail: $payload['recipient_email'] ?? null,
            settings: is_array($payload['settings'] ?? null) ? $payload['settings'] : [],
            isActive: (bool) ($payload['is_active'] ?? true),
            fields: $fields,
        );
    }
}
