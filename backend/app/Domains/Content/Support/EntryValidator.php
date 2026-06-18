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
                // Validate individual locales
                $rules["{$fieldKey}.*"] = $fieldRules;
                $attributes["{$fieldKey}.*"] = $field->name;
            } else {
                $rules[$fieldKey] = $fieldRules;
            }

            $attributes[$fieldKey] = $field->name;
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
