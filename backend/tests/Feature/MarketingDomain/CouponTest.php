<?php

namespace Tests\Feature\MarketingDomain;

use App\Domains\Identity\Models\User;
use App\Domains\Marketing\Models\MarketingCoupon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        config(['api.keys_enabled' => false]);
    }

    #[Test]
    public function admin_can_crud_coupons(): void
    {
        // 1. Create Coupon
        $responseCreate = $this->actingAs($this->admin)
            ->postJson('/api/admin/marketing/coupons', [
                'code' => 'DISCOUNT20',
                'type' => 'percentage',
                'value' => 20.00,
                'starts_at' => now()->subDay()->toIso8601String(),
                'expires_at' => now()->addDays(5)->toIso8601String(),
                'usage_limit' => 100,
                'is_active' => true,
            ]);

        $responseCreate->assertStatus(201);
        $responseCreate->assertJsonPath('data.code', 'DISCOUNT20');
        $couponId = $responseCreate->json('data.id');

        // 2. List Coupons
        $responseList = $this->actingAs($this->admin)
            ->getJson('/api/admin/marketing/coupons');
        $responseList->assertStatus(200);
        $responseList->assertJsonCount(1, 'data');

        // 3. Show Coupon
        $responseShow = $this->actingAs($this->admin)
            ->getJson("/api/admin/marketing/coupons/{$couponId}");
        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.value', 20);

        // 4. Update Coupon
        $responseUpdate = $this->actingAs($this->admin)
            ->putJson("/api/admin/marketing/coupons/{$couponId}", [
                'code' => 'DISCOUNT30',
                'type' => 'percentage',
                'value' => 30.00,
                'starts_at' => now()->subDay()->toIso8601String(),
                'expires_at' => now()->addDays(10)->toIso8601String(),
                'usage_limit' => 50,
                'is_active' => false,
            ]);
        $responseUpdate->assertStatus(200);
        $responseUpdate->assertJsonPath('data.code', 'DISCOUNT30');
        $responseUpdate->assertJsonPath('data.value', 30);
        $responseUpdate->assertJsonPath('data.is_active', false);

        // 5. Delete Coupon
        $responseDelete = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/marketing/coupons/{$couponId}");
        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('marketing_coupons', ['id' => $couponId]);
    }

    #[Test]
    public function public_visitor_can_validate_active_coupon(): void
    {
        $coupon = MarketingCoupon::create([
            'code' => 'WELCOME50',
            'type' => 'fixed',
            'value' => 50.00,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/marketing/coupons/validate', [
            'code' => 'welcome50',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.code', 'WELCOME50');
        $response->assertJsonPath('data.value', 50);
    }

    #[Test]
    public function validate_fails_for_expired_or_exhausted_coupons(): void
    {
        // Expired
        MarketingCoupon::create([
            'code' => 'EXPIRED',
            'type' => 'fixed',
            'value' => 10.00,
            'expires_at' => now()->subDay(),
            'is_active' => true,
        ]);

        // Exhausted
        MarketingCoupon::create([
            'code' => 'LIMIT',
            'type' => 'percentage',
            'value' => 15.00,
            'usage_limit' => 5,
            'used_count' => 5,
            'is_active' => true,
        ]);

        // Validate expired
        $responseExpired = $this->postJson('/api/marketing/coupons/validate', ['code' => 'EXPIRED']);
        $responseExpired->assertStatus(422);

        // Validate exhausted
        $responseLimit = $this->postJson('/api/marketing/coupons/validate', ['code' => 'LIMIT']);
        $responseLimit->assertStatus(422);
    }

    #[Test]
    public function public_visitor_can_redeem_coupon_which_increments_used_count(): void
    {
        $coupon = MarketingCoupon::create([
            'code' => 'REDEEM10',
            'type' => 'percentage',
            'value' => 10.00,
            'usage_limit' => 2,
            'used_count' => 0,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/marketing/coupons/redeem', [
            'code' => 'REDEEM10',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.used_count', 1);

        $coupon->refresh();
        $this->assertEquals(1, $coupon->used_count);
    }
}
