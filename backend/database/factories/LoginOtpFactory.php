<?php

namespace Database\Factories;

use App\Domains\Identity\Models\LoginOtp;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<LoginOtp>
 */
class LoginOtpFactory extends Factory
{
    protected $model = LoginOtp::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => null,
            'phone' => '+90' . fake()->unique()->numerify('5#########'),
            'purpose' => LoginOtp::PURPOSE_LOGIN,
            'code_hash' => Hash::make('123456'),
            'attempts' => 0,
            'max_attempts' => 5,
            'delivery_status' => LoginOtp::DELIVERY_SENT,
            'ip_address' => null,
            'user_agent' => null,
            'request_id' => null,
            'expires_at' => now()->addMinutes(5),
            'consumed_at' => null,
        ];
    }

    /**
     * Indicate that the OTP record is expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subMinute(),
        ]);
    }

    /**
     * Indicate that the OTP record has already been consumed.
     */
    public function consumed(): static
    {
        return $this->state(fn (array $attributes) => [
            'consumed_at' => now(),
        ]);
    }

    /**
     * Indicate that the OTP record has reached its max attempts.
     */
    public function maxedOut(): static
    {
        return $this->state(fn (array $attributes) => [
            'attempts' => $attributes['max_attempts'] ?? 5,
        ]);
    }
}
