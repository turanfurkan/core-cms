<?php

namespace Tests\Feature\IdentityDomain\Login;

use TuranFurkan\CoreCms\Domains\Identity\Http\Requests\Auth\LoginRequest;
use Illuminate\Routing\Redirector;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LoginRequestValidationTest extends TestCase
{
    /**
     * Run a LoginRequest through its full FormRequest lifecycle
     * (prepareForValidation + rules) without an HTTP endpoint.
     *
     * @param  array<string, mixed>  $data
     * @return array{valid: bool, errors?: array<string, array<int, string>>, request?: LoginRequest}
     */
    private function runValidation(array $data): array
    {
        $request = LoginRequest::create('/auth/login', 'POST', $data);
        $request->setContainer($this->app);
        $request->setRedirector($this->app->make(Redirector::class));

        try {
            $request->validateResolved();
        } catch (ValidationException $e) {
            return [
                'valid' => false,
                'errors' => $e->errors(),
            ];
        }

        return [
            'valid' => true,
            'request' => $request,
        ];
    }

    public function test_tcv01_email_is_accepted_and_lowercased(): void
    {
        $result = $this->runValidation([
            'login' => 'user@example.com',
            'password' => 'Password1',
        ]);

        $this->assertTrue($result['valid'], 'Valid email should pass validation.');
        $this->assertSame('email', $result['request']->resolvedType());
        $this->assertSame('user@example.com', $result['request']->input('login'));
    }

    public function test_tcv02_phone_is_accepted_and_normalized_to_e164(): void
    {
        $result = $this->runValidation([
            'login' => '05551234567',
            'password' => 'Password1',
        ]);

        $this->assertTrue($result['valid'], 'Valid TR phone should pass validation.');
        $this->assertSame('phone', $result['request']->resolvedType());
        $this->assertSame('+905551234567', $result['request']->input('login'));
    }

    public function test_tcv03_invalid_format_is_rejected(): void
    {
        $result = $this->runValidation([
            'login' => 'randomstring',
            'password' => 'Password1',
        ]);

        $this->assertFalse($result['valid']);
        $this->assertArrayHasKey('login', $result['errors']);
    }

    public function test_tcv04_missing_login_is_rejected(): void
    {
        $result = $this->runValidation([
            'password' => 'Password1',
        ]);

        $this->assertFalse($result['valid']);
        $this->assertArrayHasKey('login', $result['errors']);
        $this->assertContains('The login (email or phone) is required.', $result['errors']['login']);
    }

    public function test_tcv05_missing_password_is_rejected(): void
    {
        $result = $this->runValidation([
            'login' => 'user@example.com',
        ]);

        $this->assertFalse($result['valid']);
        $this->assertArrayHasKey('password', $result['errors']);
        $this->assertContains('The password is required.', $result['errors']['password']);
    }


    public function test_tcv06_long_password_is_rejected(): void
    {
        $result = $this->runValidation([
            'login' => 'user@example.com',
            'password' => str_repeat('a', 192),
        ]);

        $this->assertFalse($result['valid']);
        $this->assertArrayHasKey('password', $result['errors']);
    }

    public function test_tcv07_email_uppercase_is_lowercased(): void
    {
        $result = $this->runValidation([
            'login' => 'User@Example.COM',
            'password' => 'Password1',
        ]);

        $this->assertTrue($result['valid']);
        $this->assertSame('user@example.com', $result['request']->input('login'));
        $this->assertSame('email', $result['request']->resolvedType());
    }

    #[DataProvider('phoneFormatProvider')]
    public function test_tcv08_various_tr_phone_formats_normalize_to_e164(string $input): void
    {
        $result = $this->runValidation([
            'login' => $input,
            'password' => 'Password1',
        ]);

        $this->assertTrue($result['valid'], "Phone format '{$input}' should be valid.");
        $this->assertSame('phone', $result['request']->resolvedType());
        $this->assertSame('+905551112233', $result['request']->input('login'));
    }

    /**
     * @return array<string, array<int, string>>
     */
    public static function phoneFormatProvider(): array
    {
        return [
            'spaced E.164' => ['+90 555 111 22 33'],
            'leading zero' => ['0555 111 22 33'],
            'no plus' => ['905551112233'],
            'plain E.164' => ['+905551112233'],
        ];
    }
}
