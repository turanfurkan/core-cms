<?php

namespace App\Domains\Settings\DTOs;

use Illuminate\Http\Request;

final class SettingsData
{
    public function __construct(
        public readonly array $settings
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            settings: is_array($request->input('settings')) ? $request->input('settings') : []
        );
    }
}
