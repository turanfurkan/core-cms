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

        $user = User::factory()
            ->state(fn () => [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ])
            ->create();

        $user->assignRole('super_admin');

        $demoUser = User::factory()
            ->state(fn () => [
                'name' => 'Demo User',
                'email' => 'demo@kt.com',
                'password' => Hash::make('demo123'),
            ])
            ->create();

        $demoUser->assignRole('super_admin');
    }
}
