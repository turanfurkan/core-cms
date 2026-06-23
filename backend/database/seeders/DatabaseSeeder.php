<?php

namespace Database\Seeders;

use App\Domains\Identity\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(ContentTypeSeeder::class);

        $user = User::where('email', 'test@example.com')->first();
        if (!$user) {
            $user = User::factory()
                ->state(fn () => [
                    'name' => 'Test User',
                    'email' => 'test@example.com',
                ])
                ->create();
            $user->assignRole(\Spatie\Permission\Models\Role::where('name', 'super_admin')->get());
        }

        $demoUser = User::where('email', 'demo@kt.com')->first();
        if (!$demoUser) {
            $demoUser = User::factory()
                ->state(fn () => [
                    'name' => 'Demo User',
                    'email' => 'demo@kt.com',
                    'password' => Hash::make('demo123'),
                ])
                ->create();
            $demoUser->assignRole(\Spatie\Permission\Models\Role::where('name', 'super_admin')->get());
        }

        if (!\App\Domains\API\Models\ApiKey::where('name', 'Default Development Key')->exists()) {
            $rawKey = 'corecms_key_devkey1234567890abcdef1234567890';
            $hashedKey = hash('sha256', $rawKey);
            \App\Domains\API\Models\ApiKey::create([
                'name' => 'Default Development Key',
                'hashed_key' => $hashedKey,
                'hint' => 'corecms_key_...cdef',
                'scopes' => ['*'],
                'expires_at' => null,
                'is_active' => true,
            ]);
        }
    }
}
