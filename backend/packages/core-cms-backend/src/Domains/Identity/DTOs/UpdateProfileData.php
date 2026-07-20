<?php

namespace TuranFurkan\CoreCms\Domains\Identity\DTOs;

use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Profile\UpdateProfileRequest;

final class UpdateProfileData
{
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $email = null,
        public readonly ?string $phone = null,
    ) {
    }

    public static function fromRequest(UpdateProfileRequest $request): self
    {
        return new self(
            name: $request->input('name'),
            email: $request->input('email'),
            phone: $request->input('phone'),
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
        ], fn($value) => !is_null($value));
    }
}
