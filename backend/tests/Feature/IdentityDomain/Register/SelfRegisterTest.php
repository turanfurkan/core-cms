<?php

namespace Tests\Feature\IdentityDomain\Register;

use App\Domains\Identity\Events\UserRegistered;
use App\Domains\Identity\Models\LoginOtp;
use App\Domains\Identity\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SelfRegisterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        config(['user.register.require_otp_verification' => false]);
    }

    public function test_tc01_self_register_success(): void
    {
        Event::fake([UserRegistered::class]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Furkan Test',
            'phone' => '+905551112233',
            'email' => 'furkan@example.com',
            'password' => 'StrongPass1',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'token', 'user' => ['id', 'name', 'email', 'phone', 'roles']]);

        $user = User::where('phone', '+905551112233')->firstOrFail();
        $this->assertTrue($user->hasRole('user'));

        Event::assertDispatched(UserRegistered::class, function (UserRegistered $event) use ($user) {
            return $event->user->id === $user->id
                && $event->registerChannel === 'self'
                && $event->createdBy === null;
        });
    }

    public function test_tc02_duplicate_phone_is_rejected(): void
    {
        User::factory()->create([
            'phone' => '+905551112299',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Dup Phone',
            'phone' => '+905551112299',
            'password' => 'StrongPass1',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_tc03_duplicate_email_is_rejected(): void
    {
        User::factory()->create([
            'phone' => '+905551112277',
            'email' => 'taken@example.com',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Dup Email',
            'phone' => '+905551112255',
            'email' => 'taken@example.com',
            'password' => 'StrongPass1',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_invalid_phone_is_rejected(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Bad Phone',
            'phone' => '12345',
            'password' => 'StrongPass1',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'USER.VALIDATION_ERROR')
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_weak_password_is_rejected(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Weak Pass',
            'phone' => '+905551112266',
            'password' => 'weak',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_otp_disabled_returns_token(): void
    {
        config(['user.register.require_otp_verification' => false]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'No Otp',
            'phone' => '+905551113311',
            'password' => 'StrongPass1',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseCount('login_otps', 0);
    }

    public function test_otp_enabled_redirects_to_verify(): void
    {
        config(['user.register.require_otp_verification' => true]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'With Otp',
            'phone' => '+905551114411',
            'password' => 'StrongPass1',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('next', 'verify-otp')
            ->assertJsonMissing(['token' => true])
            ->assertJsonStructure(['phone', 'user']);

        $this->assertSame(1, LoginOtp::where('phone', '+905551114411')->count());
    }
}
