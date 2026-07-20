<?php

namespace Database\Seeders;

use TuranFurkan\CoreCms\Domains\Identity\Models\User;
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

        $user = User::where('email', 'test@example.com')->first();
        if (!$user) {
            $user = User::create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => Hash::make('password'),
            ]);
            $user->assignRole(\Spatie\Permission\Models\Role::where('name', 'super_admin')->get());
        }

        $demoUser = User::where('email', 'demo@kt.com')->first();
        if (!$demoUser) {
            $demoUser = User::create([
                'name' => 'Demo User',
                'email' => 'demo@kt.com',
                'password' => Hash::make('demo123'),
            ]);
            $demoUser->assignRole(\Spatie\Permission\Models\Role::where('name', 'super_admin')->get());
        }

        if (!\TuranFurkan\CoreCms\Domains\API\Models\ApiKey::where('name', 'Default Development Key')->exists()) {
            $rawKey = 'corecms_key_devkey1234567890abcdef1234567890';
            $hashedKey = hash('sha256', $rawKey);
            \TuranFurkan\CoreCms\Domains\API\Models\ApiKey::create([
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
