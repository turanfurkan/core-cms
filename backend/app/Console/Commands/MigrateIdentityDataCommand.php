<?php

namespace App\Console\Commands;

use App\Domains\Identity\Models\User;
use App\Domains\Identity\Models\Role;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateIdentityDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-identity-data {--dry-run : Run the migration in dry run mode without saving any changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate users and roles from the legacy read-only database connection';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info("=== DRY RUN MODE: No database changes will be saved ===");
        }

        // 1. Verify the legacy connection is working
        try {
            DB::connection('mysql_old')->getPdo();
            $this->info("Successfully connected to legacy database via read-only connection.");
        } catch (\Exception $e) {
            $this->error("Failed to connect to legacy database: " . $e->getMessage());
            return self::FAILURE;
        }

        // 2. Perform safe cleanup of current database users (excluding seed users 1-4)
        if (!$dryRun) {
            $this->info("Cleaning up existing non-seed users...");
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            
            // Delete users except seed users (ID 1 to 4)
            User::whereNotIn('id', [1, 2, 3, 4])->forceDelete();
            
            // Clear model_has_roles table for non-seed users
            DB::table('model_has_roles')->whereNotIn('model_id', [1, 2, 3, 4])->delete();
            
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } else {
            $this->info("[Dry Run] Would clean up existing users except IDs 1-4.");
        }

        // 3. Fetch legacy roles and show stats
        $legacyRoles = DB::connection('mysql_old')->table('roles')->get();
        $this->info("Found " . $legacyRoles->count() . " roles in legacy database.");
        foreach ($legacyRoles as $role) {
            $this->line(" - ID: {$role->id} | Name: {$role->name} | Guard: {$role->guard_name}");
        }

        // 4. Fetch legacy users and map them
        $legacyUsers = DB::connection('mysql_old')->table('users')->get();
        $totalLegacyUsers = $legacyUsers->count();
        $this->info("Found {$totalLegacyUsers} users in legacy database. Starting migration...");

        $migratedCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        foreach ($legacyUsers as $row) {
            // Protect our seed users
            if (in_array($row->id, [1, 2, 3, 4])) {
                $this->warn("Skipping legacy user ID {$row->id} ({$row->email}) to protect seed workspace user.");
                $skippedCount++;
                continue;
            }

            try {
                if ($dryRun) {
                    $this->comment("Would migrate user: {$row->name} ({$row->email}) [ID: {$row->id}]");
                    $migratedCount++;
                    continue;
                }

                // Create or update user
                $user = User::withTrashed()->where('id', $row->id)->orWhere('email', $row->email)->first();

                if (!$user) {
                    $user = User::forceCreate([
                        'id' => $row->id,
                        'name' => $row->name,
                        'email' => $row->email,
                        'phone' => $row->phone_number,
                        'password' => $row->password,
                        'email_verified_at' => $row->email_verified_at,
                        'status' => User::STATUS_ACTIVE,
                        'created_at' => $row->created_at ?: now(),
                        'updated_at' => $row->updated_at ?: now(),
                    ]);
                } else {
                    $user->update([
                        'name' => $row->name,
                        'email' => $row->email,
                        'phone' => $row->phone_number,
                        'password' => $row->password,
                        'email_verified_at' => $row->email_verified_at,
                    ]);
                }

                // Sync roles from model_has_roles
                $legacyRoleIds = DB::connection('mysql_old')
                    ->table('model_has_roles')
                    ->where('model_id', $row->id)
                    ->pluck('role_id');

                $newRoleNames = [];
                foreach ($legacyRoleIds as $roleId) {
                    if ($roleId == 1) {
                        $newRoleNames[] = 'super_admin';
                    } elseif ($roleId == 4) {
                        $newRoleNames[] = 'editor';
                    } elseif ($roleId == 5) {
                        $newRoleNames[] = 'user';
                    }
                }

                if (!empty($newRoleNames)) {
                    $user->syncRoles($newRoleNames);
                }

                $migratedCount++;
            } catch (\Exception $e) {
                $this->error("Failed to migrate user ID {$row->id} ({$row->email}): " . $e->getMessage());
                $failedCount++;
            }
        }

        $this->info("====================================");
        if ($dryRun) {
            $this->info("Dry run completed. Processed: {$totalLegacyUsers} users. Mapped: {$migratedCount}, Skipped: {$skippedCount}");
        } else {
            $this->info("Migration completed. Total legacy users: {$totalLegacyUsers}");
            $this->info("Migrated: {$migratedCount}");
            $this->info("Skipped (Seed Protected): {$skippedCount}");
            $this->info("Failed: {$failedCount}");
            
            // Compare validation counts
            $newCount = User::count();
            $this->info("Current active User count in new database: {$newCount}");
        }
        $this->info("====================================");

        return self::SUCCESS;
    }
}
