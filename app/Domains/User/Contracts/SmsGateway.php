<?php

namespace App\Domains\User\Contracts;

use App\Domains\User\Exceptions\SmsDeliveryException;

interface SmsGateway
{
    /**
     * Provider identifier (e.g. "log", "fake", "netgsm").
     */
    public function name(): string;

    /**
     * Deliver an SMS message to the given E.164 phone number.
     *
     * @throws SmsDeliveryException
     */
    public function send(string $phone, string $message): void;
}
