<?php

namespace TuranFurkan\CoreCms\Domains\Communication\DTOs;

use Illuminate\Http\Request;

class SubscriberData
{
    public function __construct(
        public readonly ?string $email,
        public readonly ?string $phone = null,
        public readonly string $status = 'active',
        public readonly ?string $ipAddress = null,
        public readonly bool $consentGiven = true
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            email: $request->input('email'),
            phone: $request->input('phone'),
            status: $request->input('status', 'active'),
            ipAddress: $request->ip(),
            consentGiven: (bool) $request->input('consent_given', true)
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'] ?? null,
            phone: $data['phone'] ?? null,
            status: $data['status'] ?? 'active',
            ipAddress: $data['ip_address'] ?? null,
            consentGiven: (bool) ($data['consent_given'] ?? true)
        );
    }
}
