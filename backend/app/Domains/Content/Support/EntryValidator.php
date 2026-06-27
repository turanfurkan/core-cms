<?php

namespace App\Domains\Content\Support;

use App\Domains\Content\Models\ContentType;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class EntryValidator
{
    public static function validate(ContentType $contentType, array $data): array
    {
        $rules = [];
        $attributes = [];

        foreach ($contentType->fields as $field) {
            $fieldKey = "data.{$field->slug}";

            if ($field->type === 'dynamic_zone') {
                $rules[$fieldKey] = ['nullable', 'array'];
                $attributes[$fieldKey] = $field->name;

                $allowedBlocks = $field->options['allowed_blocks'] ?? [];
                $allowedTypes = collect($allowedBlocks)->pluck('type')->toArray();

                $inputBlocks = data_get($data, $field->slug, []);
                if (is_array($inputBlocks)) {
                    foreach ($inputBlocks as $index => $block) {
                        $blockPrefix = "{$fieldKey}.{$index}";

                        $rules["{$blockPrefix}.id"] = ['required', 'string'];
                        $rules["{$blockPrefix}.type"] = ['required', 'string', 'in:' . implode(',', $allowedTypes)];
                        $rules["{$blockPrefix}.variant"] = ['nullable', 'string'];
                        $rules["{$blockPrefix}.data"] = ['required', 'array'];
                        $rules["{$blockPrefix}.data.*"] = ['nullable'];

                        $blockType = $block['type'] ?? null;
                        if ($blockType) {
                            $blockSchema = collect($allowedBlocks)->firstWhere('type', $blockType);
                            if ($blockSchema && isset($blockSchema['fields']) && is_array($blockSchema['fields'])) {
                                foreach ($blockSchema['fields'] as $subField) {
                                    $subFieldKey = "{$blockPrefix}.data.{$subField['slug']}";
                                    $subFieldRules = [];

                                    if ($subField['type'] === 'number') {
                                        $subFieldRules[] = 'numeric';
                                    } elseif ($subField['type'] === 'boolean') {
                                        $subFieldRules[] = 'boolean';
                                    } elseif ($subField['type'] === 'date') {
                                        $subFieldRules[] = 'date';
                                    }

                                    $subRulesConfig = $subField['validation_rules'] ?? [];
                                    if (is_array($subRulesConfig)) {
                                        foreach ($subRulesConfig as $sk => $sv) {
                                            if (is_numeric($sk)) {
                                                $subFieldRules[] = $sv;
                                            } else {
                                                if ($sk === 'required' && $sv) {
                                                    $subFieldRules[] = 'required';
                                                } elseif ($sk === 'max' && $sv) {
                                                    $subFieldRules[] = "max:{$sv}";
                                                } elseif ($sk === 'min' && $sv) {
                                                    $subFieldRules[] = "min:{$sv}";
                                                }
                                            }
                                        }
                                    }

                                    if (!in_array('required', $subFieldRules) && !in_array('nullable', $subFieldRules)) {
                                        $subFieldRules[] = 'nullable';
                                    }

                                    $subLocalized = $subField['options']['localized'] ?? $subField['localized'] ?? false;
                                    if ($subLocalized) {
                                        $rules[$subFieldKey] = ['array'];
                                        $localization = $contentType->settings['localization'] ?? null;
                                        $defaultLang = $localization['default_lang'] ?? 'tr';
                                        $supportedLangs = $localization['supported_langs'] ?? [$defaultLang];

                                        // Merge any language keys that are actually present in the input data to prevent them from being filtered out
                                        $inputLangs = array_keys(data_get($data, "{$field->slug}.{$index}.data.{$subField['slug']}", []));
                                        $allLangs = array_unique(array_merge($supportedLangs, $inputLangs));

                                        foreach ($allLangs as $langCode) {
                                            if ($langCode === $defaultLang) {
                                                $rules["{$subFieldKey}.{$langCode}"] = $subFieldRules;
                                            } else {
                                                $otherRules = array_filter($subFieldRules, fn($r) => $r !== 'required');
                                                if (!in_array('nullable', $otherRules)) {
                                                    $otherRules[] = 'nullable';
                                                }
                                                $rules["{$subFieldKey}.{$langCode}"] = array_values($otherRules);
                                            }
                                            $attributes["{$subFieldKey}.{$langCode}"] = "{$field->name} > " . ($blockSchema['name'] ?? $blockType) . " > " . $subField['name'] . " (" . strtoupper($langCode) . ")";
                                        }
                                    } else {
                                        $rules[$subFieldKey] = $subFieldRules;
                                    }
                                    $attributes[$subFieldKey] = "{$field->name} > " . ($blockSchema['name'] ?? $blockType) . " > " . $subField['name'];
                                }
                            }
                        }
                    }
                }
            } else {
                $fieldRules = [];

                // Add standard database constraints based on field types
                if ($field->type === 'number') {
                    $fieldRules[] = 'numeric';
                } elseif ($field->type === 'boolean') {
                    $fieldRules[] = 'boolean';
                } elseif ($field->type === 'date') {
                    $fieldRules[] = 'date';
                }

                // Merge rules defined in the database
                $schemaRules = $field->validation_rules ?? [];
                if (is_array($schemaRules)) {
                    $cleanedRules = [];
                    foreach ($schemaRules as $k => $v) {
                        if (is_numeric($k)) {
                            $cleanedRules[] = $v;
                        } else {
                            if ($k === 'required' && $v) {
                                $cleanedRules[] = 'required';
                            } elseif ($k === 'max' && $v) {
                                $cleanedRules[] = "max:{$v}";
                            } elseif ($k === 'min' && $v) {
                                $cleanedRules[] = "min:{$v}";
                            }
                        }
                    }
                    $fieldRules = array_merge($fieldRules, $cleanedRules);
                }

                // If the rule list doesn't explicitly specify nullable/required, make it nullable
                if (!in_array('required', $fieldRules) && !in_array('nullable', $fieldRules)) {
                    $fieldRules[] = 'nullable';
                }

                $isLocalized = $field->options['localized'] ?? false;

                if ($isLocalized) {
                    $rules[$fieldKey] = ['array'];

                    $localization = $contentType->settings['localization'] ?? null;
                    $defaultLang = $localization['default_lang'] ?? 'tr';
                    $supportedLangs = $localization['supported_langs'] ?? [$defaultLang];

                    // Merge any language keys that are actually present in the input data to prevent them from being filtered out
                    $inputLangs = array_keys(data_get($data, $field->slug, []));
                    $allLangs = array_unique(array_merge($supportedLangs, $inputLangs));

                    foreach ($allLangs as $langCode) {
                        if ($langCode === $defaultLang) {
                            $rules["{$fieldKey}.{$langCode}"] = $fieldRules;
                        } else {
                            $otherRules = array_filter($fieldRules, fn($r) => $r !== 'required');
                            if (!in_array('nullable', $otherRules)) {
                                            $otherRules[] = 'nullable';
                            }
                            $rules["{$fieldKey}.{$langCode}"] = array_values($otherRules);
                        }
                        $attributes["{$fieldKey}.{$langCode}"] = $field->name . ' (' . strtoupper($langCode) . ')';
                    }
                } else {
                    $rules[$fieldKey] = $fieldRules;
                }

                $attributes[$fieldKey] = $field->name;
            }
        }

        $validator = Validator::make(
            ['data' => $data],
            $rules,
            [],
            $attributes
        );

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        // Return only the validated data array
        return $validator->validated()['data'] ?? [];
    }
}
