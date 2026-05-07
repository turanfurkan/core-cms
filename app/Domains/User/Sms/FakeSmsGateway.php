<?php

namespace App\Domains\User\Sms;

use App\Domains\User\Contracts\SmsGateway;
use App\Domains\User\Exceptions\SmsDeliveryException;
use PHPUnit\Framework\Assert;

class FakeSmsGateway implements SmsGateway
{
    /**
     * @var list<array{phone: string, message: string}>
     */
    public array $sent = [];

    private bool $failNext = false;

    public function name(): string
    {
        return 'fake';
    }

    public function failNext(): void
    {
        $this->failNext = true;
    }

    public function send(string $phone, string $message): void
    {
        if ($this->failNext) {
            $this->failNext = false;

            throw new SmsDeliveryException(
                provider: $this->name(),
                message: 'Simulated SMS delivery failure.',
                errorCode: 'fake.delivery_failed',
            );
        }

        $this->sent[] = ['phone' => $phone, 'message' => $message];
    }

    public function assertSentTo(string $phone): void
    {
        $matches = array_filter($this->sent, fn (array $msg): bool => $msg['phone'] === $phone);

        Assert::assertNotEmpty(
            $matches,
            sprintf('Expected an SMS to be sent to [%s], none recorded.', $phone),
        );
    }

    public function assertNothingSent(): void
    {
        Assert::assertSame([], $this->sent, 'Expected no SMS to be sent, but messages were recorded.');
    }

    public function lastMessage(): ?string
    {
        $last = end($this->sent);

        return $last === false ? null : $last['message'];
    }
}
