<?php

namespace Database\Seeders;

use App\Domains\Content\Models\ContentType;
use App\Domains\Content\Models\ContentField;
use Illuminate\Database\Seeder;

class RacesContentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $contentTypeData = [
            'name' => 'Yarışlar',
            'slug' => 'yarislar',
            'description' => 'Sporfest kapsamındaki tüm yarışların genel, detay, ücret ve başlangıç sorumlusu bilgilerini barındıran dinamik şablon.',
            'is_collection' => true,
            'settings' => [
                'icon' => 'Sparkles',
                'color' => '#1e3a8a', // Koyu Mavi
                'seo_enabled' => true,
                'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
            ]
        ];

        // Create or update content type
        $contentType = ContentType::updateOrCreate(
            ['slug' => $contentTypeData['slug']],
            $contentTypeData
        );

        $fields = [
            // Sol Taraf - Genel Bilgiler
            ['name' => 'Çoklu Yarış', 'slug' => 'is_multi_race', 'type' => 'boolean', 'validation_rules' => [], 'options' => [], 'order' => 1],
            ['name' => 'Yarışlar', 'slug' => 'child_races', 'type' => 'relation', 'validation_rules' => [], 'options' => ['target' => 'yarislar', 'multiple' => true], 'order' => 2],
            ['name' => 'Satış Durumu', 'slug' => 'is_sales_active', 'type' => 'boolean', 'validation_rules' => [], 'options' => [], 'order' => 3],
            ['name' => 'Ücretsiz Yarış', 'slug' => 'is_free', 'type' => 'boolean', 'validation_rules' => [], 'options' => [], 'order' => 4],
            ['name' => 'Yarış Adı', 'slug' => 'title', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 5],
            ['name' => 'Yarış Metni', 'slug' => 'content', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 6],
            ['name' => 'Yarış Resmi', 'slug' => 'cover_image', 'type' => 'media', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 7],
            ['name' => 'Yarış Grafik Görseli', 'slug' => 'graphic_image', 'type' => 'media', 'validation_rules' => [], 'options' => [], 'order' => 8],
            ['name' => 'Yarış Video (Youtube Embed)', 'slug' => 'youtube_embed', 'type' => 'text', 'validation_rules' => [], 'options' => [], 'order' => 9],
            ['name' => 'Neler Dahil?', 'slug' => 'whats_included', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 10],
            ['name' => 'Ürün Galerisi', 'slug' => 'gallery', 'type' => 'gallery', 'validation_rules' => [], 'options' => [], 'order' => 11],
            ['name' => 'GPX Dosyası Yükle', 'slug' => 'gpx_file', 'type' => 'media', 'validation_rules' => [], 'options' => [], 'order' => 12],
            ['name' => 'Strava Dosyası Yükle', 'slug' => 'strava_file', 'type' => 'media', 'validation_rules' => [], 'options' => [], 'order' => 13],
            ['name' => 'Kategori', 'slug' => 'category_id', 'type' => 'relation', 'validation_rules' => [], 'options' => ['target' => 'categories'], 'order' => 14],
            ['name' => 'Durum', 'slug' => 'status_select', 'type' => 'string', 'validation_rules' => [], 'options' => [], 'order' => 15],
            ['name' => 'Lokasyon', 'slug' => 'location_embed', 'type' => 'text', 'validation_rules' => [], 'options' => [], 'order' => 16],

            // Sağ Taraf - Yarış Başlangıç ve Sorumlu Bilgileri
            ['name' => 'Yarış Başlangıç Tarihi', 'slug' => 'start_date', 'type' => 'date', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 17],
            ['name' => 'Yarış Başlangıç Saati', 'slug' => 'start_time', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 18],
            ['name' => 'Yarış Sorumlusu', 'slug' => 'manager_name', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 19],
            ['name' => 'Yarış Sorumlusu Telefon', 'slug' => 'manager_phone', 'type' => 'phone', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 20],
            ['name' => 'Son Katılım Tarihi', 'slug' => 'registration_deadline', 'type' => 'date', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 21],
            ['name' => 'Max Katılımcı Sayısı', 'slug' => 'max_participants', 'type' => 'number', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 22],
            ['name' => 'Mesafe (KM)', 'slug' => 'distance', 'type' => 'string', 'validation_rules' => [], 'options' => [], 'order' => 23],
            ['name' => 'Başlangıç Noktası', 'slug' => 'start_point', 'type' => 'string', 'validation_rules' => [], 'options' => [], 'order' => 24],
            ['name' => 'Bitiş Noktası', 'slug' => 'finish_point', 'type' => 'string', 'validation_rules' => [], 'options' => [], 'order' => 25],
            ['name' => 'Yükseklik', 'slug' => 'elevation', 'type' => 'string', 'validation_rules' => [], 'options' => [], 'order' => 26],
            ['name' => 'İniş', 'slug' => 'descent', 'type' => 'string', 'validation_rules' => [], 'options' => [], 'order' => 27],
            ['name' => 'Contest', 'slug' => 'contest_id', 'type' => 'number', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 28],
        ];

        // Seed associated fields
        $incomingSlugs = [];
        foreach ($fields as $field) {
            $incomingSlugs[] = $field['slug'];
            ContentField::updateOrCreate(
                [
                    'content_type_id' => $contentType->id,
                    'slug' => $field['slug']
                ],
                $field
            );
        }

        // Clean up fields that are no longer in the schema
        $contentType->fields()->whereNotIn('slug', $incomingSlugs)->delete();
    }
}
