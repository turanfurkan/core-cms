<?php

namespace App\Console\Commands;

use App\Domains\Category\Models\Category;
use App\Domains\Media\Models\MediaItem;
use App\Domains\Media\Models\MediaLibraryPlaceholder;
use App\Domains\Race\Models\Participant;
use App\Domains\Race\Models\Registration;
use App\Domains\Billing\Models\Order;
use App\Domains\Billing\Models\OrderItem;
use App\Domains\Billing\Models\PaymentTransaction;
use App\Domains\Identity\Models\User;
use App\Domains\Race\Models\Race;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class MigrateLegacyRaceAndBillingDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-race-and-billing-data {--skip-media : Skip downloading and migrating media files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate legacy categories, races, participants, registrations, and payments directly from the mysql_old connection';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $skipMedia = $this->option('skip-media');

        // 1. Verify connections
        try {
            DB::connection('mysql_old')->getPdo();
            $this->info("Successfully connected to read-only legacy database.");
        } catch (\Exception $e) {
            $this->error("Failed to connect to legacy database: " . $e->getMessage());
            return self::FAILURE;
        }

        $defaultUserId = User::first()?->id;
        if (!$defaultUserId) {
            $this->error("No default user found in local database. Please seed users first.");
            return self::FAILURE;
        }

        // 2. Truncate current tables
        $this->info("Truncating current categories, races, participants, registrations, and billing tables...");
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        Category::truncate();
        Race::truncate();
        Participant::truncate();
        Registration::truncate();
        Order::truncate();
        OrderItem::truncate();
        PaymentTransaction::truncate();
        DB::table('race_relations')->truncate();
        DB::table('categorizables')->truncate();
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->info("Current database cleared.");

        // 3. Migrate Categories (Events)
        $this->info("Migrating categories (events)...");
        $legacyCategories = DB::connection('mysql_old')->table('categories')->get();
        $categoryMap = [];

        foreach ($legacyCategories as $cat) {
            $imageId = $skipMedia ? null : $this->downloadAndRegisterMedia($cat->image);

            $category = Category::forceCreate([
                'id' => $cat->id,
                'name' => ['tr' => $cat->name, 'en' => $cat->name],
                'slug' => ['tr' => Str::slug($cat->name), 'en' => Str::slug($cat->name)],
                'description' => ['tr' => $cat->desc ?: $cat->name, 'en' => $cat->desc ?: $cat->name],
                'image_id' => $imageId,
                'parent_id' => null,
                'type' => 'race',
                'order' => $cat->order ?? 0,
                'is_active' => (bool) ($cat->is_active ?? true),
                'created_at' => $cat->created_at ?: now(),
                'updated_at' => $cat->updated_at ?: now(),
            ]);

            $categoryMap[$cat->id] = $category->id;
        }

        // Handle missing/placeholder categories referenced in races
        $placeholders = [
            12 => 'LİKYA GRANFONDO 2024',
            13 => 'ÖLÜDENİZ OPEN WATER 2024',
            14 => 'LİKYA YARI MARATONU 2024',
            101 => 'KING OF THE HILL 2026',
            102 => 'YARIM ADA CHALLENGE 2025',
        ];

        foreach ($placeholders as $legacyId => $name) {
            if (!isset($categoryMap[$legacyId])) {
                $category = Category::forceCreate([
                    'id' => $legacyId,
                    'name' => ['tr' => $name, 'en' => $name],
                    'slug' => ['tr' => Str::slug($name), 'en' => Str::slug($name)],
                    'description' => ['tr' => $name, 'en' => $name],
                    'image_id' => null,
                    'parent_id' => null,
                    'type' => 'race',
                    'order' => 0,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $categoryMap[$legacyId] = $category->id;
            }
        }
        $this->info("Categories migrated successfully.");

        // 4. Migrate Races (Parkours)
        $this->info("Migrating races (parkours)...");
        $legacyRaces = DB::connection('mysql_old')->table('races')->get();

        $legacyRaceImages = [];
        if (!$skipMedia) {
            $legacyRaceImages = DB::connection('mysql_old')
                ->table('race_images')
                ->get()
                ->groupBy('race_id');
        }

        foreach ($legacyRaces as $race) {
            $coverImageId = $skipMedia ? null : $this->downloadAndRegisterMedia($race->image);
            $graphicImageId = $skipMedia ? null : $this->downloadAndRegisterMedia($race->graph_image);
            $gpxFileId = $skipMedia ? null : $this->downloadAndRegisterMedia($race->gpx_file);
            $stravaFileId = $skipMedia ? null : $this->downloadAndRegisterMedia($race->strava_file);

            // Gallery images
            $galleryIds = [];
            if (!$skipMedia) {
                $legacyImages = $legacyRaceImages[$race->id] ?? collect();
                foreach ($legacyImages as $img) {
                    $galleryImageId = $this->downloadAndRegisterMedia($img->image);
                    if ($galleryImageId) {
                        $galleryIds[] = $galleryImageId;
                    }
                }
            }

            // Start Time normalization
            $startTime = '08:00';
            if ($race->race_time) {
                $parts = explode(':', $race->race_time);
                if (count($parts) >= 2) {
                    $startTime = $parts[0] . ':' . $parts[1];
                }
            }

            $newRace = Race::forceCreate([
                'id' => $race->id,
                'title' => ['tr' => $race->race_name, 'en' => $race->race_name],
                'slug' => ['tr' => $race->slug ?: Str::slug($race->race_name), 'en' => $race->slug ?: Str::slug($race->race_name)],
                'content' => ['tr' => $race->description ?: '', 'en' => $race->description ?: ''],
                'start_date' => $race->race_date,
                'start_time' => $startTime,
                'location_embed' => $race->location ?: '',
                'price' => (float) $race->entry_fee,
                'discounted_price' => (float) $race->discounted_price,
                'registration_deadline' => $race->registration_deadline,
                'max_participants' => (int) $race->max_participants,
                'distance' => (string) $race->distance,
                'start_point' => $race->start_point ?: '',
                'finish_point' => $race->end_point ?: '',
                'elevation' => (string) $race->elevation_gain,
                'descent' => (string) $race->elevation_loss,
                'cover_image_id' => $coverImageId,
                'graphic_image_id' => $graphicImageId,
                'gpx_file_id' => $gpxFileId,
                'strava_file_id' => $stravaFileId,
                'gallery_ids' => $galleryIds,
                'youtube_embed' => $race->race_video ?: '',
                'is_multi_race' => (bool) $race->is_multiple,
                'manager_name' => $race->trainer ?: 'Sorumlu Belirtilmedi',
                'manager_phone' => $race->phone_number ?: '5555555555',
                'is_sales_active' => (bool) $race->registration_opened,
                'contest_id' => (int) $race->contest,
                'is_free' => (bool) $race->is_free,
                'order' => 0,
                'status' => $race->status === 'publish' ? 'published' : 'unpublished',
                'created_at' => $race->created_at ?: now(),
                'updated_at' => $race->updated_at ?: now(),
            ]);

            // Sync category polymorphically
            $categoryId = $categoryMap[$race->category_id] ?? null;
            if ($categoryId) {
                $newRace->categories()->sync([$categoryId]);
            }
        }
        $this->info("Races migrated successfully.");

        // 5. Link Multi-races
        $this->info("Linking multi-race relations...");
        $legacyMultiRaces = DB::connection('mysql_old')->table('multiple_races')->get();
        $localRacesMap = Race::all()->keyBy('id');
        $insertedRelations = [];

        foreach ($legacyMultiRaces as $relation) {
            $parent = $localRacesMap->get($relation->parent_race_id);
            if ($parent) {
                $relKey = $relation->parent_race_id . '_' . $relation->race_id;
                if (!isset($insertedRelations[$relKey])) {
                    $parent->childRaces()->attach($relation->race_id);
                    $insertedRelations[$relKey] = true;
                }
            }
        }
        $this->info("Multi-race relations linked successfully.");

        // 6. Migrate Participants (with Deduplication)
        $this->info("Migrating participants...");
        $legacyParticipants = DB::connection('mysql_old')->table('participants')->get();
        $participantMapping = [];
        $processedIdentities = [];
        $processedNames = [];
        $pCount = 0;

        $existingUserIdsMap = array_flip(User::pluck('id')->toArray());

        foreach ($legacyParticipants as $row) {
            $identity = trim($row->identity_number ?? '');
            $phone = trim($row->phone_number ?? '');
            $nameKey = Str::slug($row->name) . '_' . Str::slug($phone);

            $isDuplicate = false;
            $existingId = null;

            if ($identity !== '') {
                if (isset($processedIdentities[$identity])) {
                    $isDuplicate = true;
                    $existingId = $processedIdentities[$identity];
                }
            } else {
                if (isset($processedNames[$nameKey])) {
                    $isDuplicate = true;
                    $existingId = $processedNames[$nameKey];
                }
            }

            if ($isDuplicate) {
                $participantMapping[$row->id] = $existingId;
                continue;
            }

            // Parse Date of Birth
            $dob = null;
            if (!empty($row->date_of_birth)) {
                try {
                    if (str_contains($row->date_of_birth, '/')) {
                        $dob = Carbon::createFromFormat('d/m/Y', $row->date_of_birth);
                    } else {
                        $dob = Carbon::parse($row->date_of_birth);
                    }
                } catch (\Exception $e) {
                    // fall through
                }
            }

            // Normalize Gender
            $gender = 'other';
            if ($row->gender === '1') {
                $gender = 'male';
            } elseif ($row->gender === '2') {
                $gender = 'female';
            } elseif (in_array(strtolower($row->gender), ['male', 'female'])) {
                $gender = strtolower($row->gender);
            }

            $userId = isset($existingUserIdsMap[$row->user_id]) ? $row->user_id : $defaultUserId;

            $participant = Participant::forceCreate([
                'id' => $row->id,
                'user_id' => $userId,
                'name' => trim($row->name),
                'gender' => $gender,
                'date_of_birth' => $dob,
                'identity_number' => $identity !== '' ? $identity : null,
                'blood_type' => $row->blood_type,
                'phone_number' => $phone,
                't_shirt_size' => $row->t_shirt_size,
                'club_name' => $row->club_name,
                'nationality' => $row->nationality ?? 'TR',
                'emergency_contact' => $row->emergency_contact,
                'emergency_phone_number' => $row->emergency_phone_number,
                'created_at' => $row->created_at ?: now(),
                'updated_at' => $row->updated_at ?: now(),
            ]);

            $participantMapping[$row->id] = $participant->id;

            if ($identity !== '') {
                $processedIdentities[$identity] = $participant->id;
            }
            $processedNames[$nameKey] = $participant->id;
            $pCount++;
        }
        $this->info("Imported {$pCount} unique participants.");

        // 7. Migrate Registrations
        $this->info("Migrating registrations...");
        // Handle registrations table name variations
        $regTable = 'registrations';
        try {
            DB::connection('mysql_old')->table($regTable)->first();
        } catch (\Exception $e) {
            $regTable = 'registirations'; // fallback to legacy typo
        }

        $legacyRegistrations = DB::connection('mysql_old')->table($regTable)->get();
        $registrationMapping = [];
        $regCount = 0;

        $existingRaceIdsMap = array_flip(Race::pluck('id')->toArray());
        $insertedRegistrations = [];

        foreach ($legacyRegistrations as $row) {
            $newParticipantId = $participantMapping[$row->participant_id] ?? null;

            if (!$newParticipantId) {
                continue;
            }

            if (!isset($existingRaceIdsMap[$row->race_id])) {
                continue;
            }

            // Prevent duplicate registration insert for the same participant and race in-memory
            $regKey = $row->race_id . '_' . $newParticipantId;
            if (isset($insertedRegistrations[$regKey])) {
                continue;
            }
            $insertedRegistrations[$regKey] = true;

            $userId = isset($existingUserIdsMap[$row->user_id]) ? $row->user_id : $defaultUserId;

            $registration = Registration::forceCreate([
                'id' => $row->id,
                'participant_id' => $newParticipantId,
                'race_id' => $row->race_id,
                'user_id' => $userId,
                'race_category_id' => null, // age categories mapped on demand
                'bib_number' => $newParticipantId,
                'price' => $row->price,
                'status' => $row->status === 'paid' ? 'paid' : ($row->status === 'success' ? 'paid' : 'pending'),
                'payment_id' => null,
                'group_id' => $row->group_id,
                'created_at' => $row->created_at ?: now(),
                'updated_at' => $row->updated_at ?: now(),
            ]);

            $registrationMapping[$row->id] = $registration->id;
            $regCount++;
        }
        $this->info("Imported {$regCount} registrations.");

        // 8. Migrate Payments to Orders & Transactions
        $this->info("Migrating payments to Orders and Transactions...");
        $legacyPayments = DB::connection('mysql_old')->table('payments')->get();
        $orderCount = 0;

        $legacyParticipantsByPayment = DB::connection('mysql_old')
            ->table('participants')
            ->whereNotNull('payment_id')
            ->get()
            ->groupBy('payment_id');

        $regTable = 'registrations';
        try {
            DB::connection('mysql_old')->table($regTable)->first();
        } catch (\Exception $e) {
            $regTable = 'registirations';
        }

        $legacyRegsByParticipant = DB::connection('mysql_old')
            ->table($regTable)
            ->get()
            ->groupBy('participant_id');

        $localRegistrationsMap = Registration::all()->keyBy('id');

        foreach ($legacyPayments as $row) {
            $userId = isset($existingUserIdsMap[$row->user_id]) ? $row->user_id : $defaultUserId;

            $createdAt = $row->created_at ?: now();
            $gateway = Carbon::parse($createdAt)->greaterThanOrEqualTo(Carbon::parse('2026-05-13 00:00:00')) ? 'halkbank' : 'paytr';

            $order = Order::forceCreate([
                'id' => $row->id,
                'user_id' => $userId,
                'amount' => $row->payment_amount / 100, // convert kurus/cents to TL
                'currency' => $row->currency ?: 'TRY',
                'status' => $row->status === 'success' ? 'paid' : ($row->status === 'paid' ? 'paid' : 'failed'),
                'gateway' => $gateway,
                'transaction_id' => $row->merchant_oid,
                'created_at' => $createdAt,
                'updated_at' => $row->updated_at ?: now(),
            ]);

            PaymentTransaction::create([
                'order_id' => $order->id,
                'gateway' => $gateway,
                'transaction_id' => $row->merchant_oid,
                'amount' => $row->payment_amount / 100,
                'status' => $row->status === 'success' ? 'success' : ($row->status === 'paid' ? 'success' : 'failed'),
                'payload' => (array) $row,
                'error_message' => $row->status !== 'success' && $row->status !== 'paid' ? ($row->failed_reason_msg ?: 'Payment failed') : null,
                'created_at' => $createdAt,
                'updated_at' => $row->updated_at ?: now(),
            ]);

            // Link registrations to this order using pre-fetched participants' payment_id
            $legacyPaidParts = $legacyParticipantsByPayment[$row->id] ?? collect();
            $legacyPaidPartIds = $legacyPaidParts->pluck('id')->toArray();

            $legacyRegs = collect();
            foreach ($legacyPaidPartIds as $partId) {
                if (isset($legacyRegsByParticipant[$partId])) {
                    $legacyRegs = $legacyRegs->merge($legacyRegsByParticipant[$partId]);
                }
            }

            foreach ($legacyRegs as $legacyReg) {
                // Find the corresponding new registration (they share the same ID!)
                $registration = $localRegistrationsMap->get($legacyReg->id);

                if ($registration) {
                    $regPrice = floatval($legacyReg->price);
                    $fallbackPrice = ($row->payment_amount / 100) / max(1, $legacyRegs->count());
                    $itemPrice = ($regPrice > 0) ? $regPrice : $fallbackPrice;

                    OrderItem::create([
                        'order_id' => $order->id,
                        'orderable_type' => Registration::class,
                        'orderable_id' => $registration->id,
                        'price' => $itemPrice,
                        'quantity' => 1,
                        'created_at' => $row->created_at ?: now(),
                        'updated_at' => $row->updated_at ?: now(),
                    ]);

                    if ($order->status === 'paid') {
                        $registration->update([
                            'status' => 'paid',
                            'payment_id' => $row->merchant_oid,
                            'price' => $itemPrice,
                        ]);
                    }
                }
            }

            $orderCount++;
        }
        $this->info("Imported {$orderCount} orders and payment transactions.");

        // 9. Verification & Auditing Report
        $this->info("====================================");
        $this->info("MIGRATION COMPLETED & AUDIT REPORT:");
        $this->info("====================================");

        $legacySuccessPaymentsCount = DB::connection('mysql_old')
            ->table('payments')
            ->whereIn('status', ['success', 'paid'])
            ->count();

        $legacySuccessPaymentsSum = DB::connection('mysql_old')
            ->table('payments')
            ->whereIn('status', ['success', 'paid'])
            ->sum('payment_amount') / 100;

        $newPaidOrdersCount = Order::where('status', 'paid')->count();
        $newPaidOrdersSum = Order::where('status', 'paid')->sum('amount');

        $this->line("Legacy Paid Payments Count: {$legacySuccessPaymentsCount}");
        $this->line("New Paid Orders Count:      {$newPaidOrdersCount}");
        $this->line("Legacy Paid Payments Sum:   {$legacySuccessPaymentsSum} TRY");
        $this->line("New Paid Orders Sum:        {$newPaidOrdersSum} TRY");

        if (abs($legacySuccessPaymentsSum - $newPaidOrdersSum) < 0.01) {
            $this->info("SUCCESS: Financial figures match exactly!");
        } else {
            $this->warn("WARNING: Financial difference detected: " . abs($legacySuccessPaymentsSum - $newPaidOrdersSum) . " TRY");
        }
        $this->info("====================================");

        return self::SUCCESS;
    }

    /**
     * Download media from URL and register in media library.
     */
    private function downloadAndRegisterMedia(?string $relativePath): ?int
    {
        if (empty($relativePath)) {
            return null;
        }

        $cleanPath = ltrim($relativePath, '/');
        $url = "https://sporfest.com.tr/" . $cleanPath;
        $fileName = basename($cleanPath);

        // Deduplicate: check if we already have this file in media library
        $existing = MediaItem::where('file_name', $fileName)->first();
        if ($existing) {
            return $existing->id;
        }

        try {
            $placeholder = MediaLibraryPlaceholder::firstOrCreate([
                'name' => 'global_library',
            ]);

            // Create a temporary file path
            $tempDir = storage_path('app/temp_media');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0777, true);
            }
            $tempFile = $tempDir . '/' . $fileName;

            // Download file using custom curl to bypass SSL issues on local dev
            $ch = curl_init($url);
            $fp = fopen($tempFile, 'wb');
            curl_setopt($ch, CURLOPT_FILE, $fp);
            curl_setopt($ch, CURLOPT_HEADER, 0);
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_exec($ch);
            $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            fclose($fp);

            if ($statusCode !== 200 && $statusCode !== 206) {
                if (file_exists($tempFile)) {
                    unlink($tempFile);
                }
                $this->warn("Failed to download media from {$url} (HTTP Code: {$statusCode})");
                return null;
            }

            if (!file_exists($tempFile) || filesize($tempFile) === 0) {
                if (file_exists($tempFile)) {
                    unlink($tempFile);
                }
                $this->warn("Failed to download media from {$url} (File empty or not found)");
                return null;
            }

            // Register in media library using local path
            $media = $placeholder->addMedia($tempFile)
                ->toMediaCollection('default');

            // Clean up temp file
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }

            return $media->id;
        } catch (\Exception $e) {
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }
            $this->warn("Failed to download media from {$url}: " . $e->getMessage());
            return null;
        }
    }
}
