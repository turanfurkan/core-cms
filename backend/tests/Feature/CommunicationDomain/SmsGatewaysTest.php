<?php

namespace Tests\Feature\CommunicationDomain;

use App\Domains\Identity\Exceptions\SmsDeliveryException;
use App\Domains\Identity\Sms\NetgsmSmsGateway;
use App\Domains\Identity\Sms\TwilioSmsGateway;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SmsGatewaysTest extends TestCase
{
    public function test_netgsm_gateway_sends_successful_request(): void
    {
        Http::fake([
            'api.netgsm.com.tr/*' => Http::response('00 987654', 200),
        ]);

        $gateway = new NetgsmSmsGateway('user123', 'pass123', 'MYHEADER');
        $gateway->send('+905554443322', 'Hello Netgsm');

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.netgsm.com.tr/sms/send/get'
                && $request['usercode'] === 'user123'
                && $request['password'] === 'pass123'
                && $request['gsmno'] === '905554443322'
                && $request['message'] === 'Hello Netgsm'
                && $request['msgheader'] === 'MYHEADER';
        });
    }

    public function test_netgsm_gateway_throws_delivery_exception_on_error(): void
    {
        Http::fake([
            'api.netgsm.com.tr/*' => Http::response('30', 200),
        ]);

        $gateway = new NetgsmSmsGateway('user123', 'pass123', 'MYHEADER');

        $this->expectException(SmsDeliveryException::class);
        $this->expectExceptionMessage('Netgsm failed with status: 30');

        $gateway->send('+905554443322', 'Hello Netgsm');
    }

    public function test_twilio_gateway_sends_successful_request(): void
    {
        Http::fake([
            'api.twilio.com/*' => Http::response(['sid' => 'SMxxx'], 200),
        ]);

        $gateway = new TwilioSmsGateway('ACsid', 'auth_token_val', '+123456789');
        $gateway->send('+905554443322', 'Hello Twilio');

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'api.twilio.com')
                && $request['From'] === '+123456789'
                && $request['To'] === '+905554443322'
                && $request['Body'] === 'Hello Twilio';
        });
    }

    public function test_twilio_gateway_throws_delivery_exception_on_error(): void
    {
        Http::fake([
            'api.twilio.com/*' => Http::response(['message' => 'Invalid number', 'code' => 21211], 400),
        ]);

        $gateway = new TwilioSmsGateway('ACsid', 'auth_token_val', '+123456789');

        $this->expectException(SmsDeliveryException::class);
        $this->expectExceptionMessage('Invalid number');

        $gateway->send('+905554443322', 'Hello Twilio');
    }
}
