<?php

namespace Database\Seeders;

use App\Domains\Content\Models\ContentType;
use App\Domains\Content\Models\ContentField;
use Illuminate\Database\Seeder;

class ContentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $contentTypes = [
            // --- 1. SINGLE TYPES ---
            [
                'name' => 'Ana Sayfa',
                'slug' => 'homepage',
                'description' => 'Slider alanları, öne çıkan başlıklar, CTA buton metinleri ve tanıtım alanları gibi sadece ana sayfaya özel verilerin yönetildiği şablon.',
                'is_collection' => false,
                'settings' => [
                    'icon' => 'Globe',
                    'color' => '#3b82f6', // Blue
                    'seo_enabled' => true,
                    'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
                ],
                'fields' => [
                    ['name' => 'Başlık', 'slug' => 'title', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 1],
                    ['name' => 'Hero Slider Başlığı', 'slug' => 'hero_title', 'type' => 'string', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 2],
                    ['name' => 'Hero Slider Alt Başlığı', 'slug' => 'hero_subtitle', 'type' => 'string', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 3],
                    ['name' => 'CTA Buton Metni', 'slug' => 'hero_cta_text', 'type' => 'string', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 4],
                    ['name' => 'CTA Buton Linki', 'slug' => 'hero_cta_link', 'type' => 'url', 'validation_rules' => [], 'options' => [], 'order' => 5],
                    ['name' => 'Tanıtım Bölümü Başlığı', 'slug' => 'features_title', 'type' => 'string', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 6],
                ]
            ],
            [
                'name' => 'Hakkımızda',
                'slug' => 'about-us',
                'description' => 'Şirket hikayesi, vizyon, misyon ve kurumsal metinlerin yer aldığı sabit sayfa yapısı.',
                'is_collection' => false,
                'settings' => [
                    'icon' => 'FileText',
                    'color' => '#8b5cf6', // Purple
                    'seo_enabled' => true,
                    'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
                ],
                'fields' => [
                    ['name' => 'Başlık', 'slug' => 'title', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 1],
                    ['name' => 'Şirket Hikayesi', 'slug' => 'story', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 2],
                    ['name' => 'Vizyon', 'slug' => 'vision', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 3],
                    ['name' => 'Misyon', 'slug' => 'mission', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 4],
                    ['name' => 'Kapak Görseli', 'slug' => 'cover_image', 'type' => 'media', 'validation_rules' => [], 'options' => [], 'order' => 5],
                ]
            ],
            [
                'name' => 'İletişim',
                'slug' => 'contact',
                'description' => 'Harita koordinatları, adres, telefon, e-posta ve sosyal medya linkleri gibi dinamik iletişim bilgilerini tutan şablon.',
                'is_collection' => false,
                'settings' => [
                    'icon' => 'Sliders',
                    'color' => '#ec4899', // Pink
                    'seo_enabled' => true,
                    'localization' => ['enabled' => false, 'default_lang' => 'tr', 'supported_langs' => ['tr']],
                ],
                'fields' => [
                    ['name' => 'Adres', 'slug' => 'address', 'type' => 'text', 'validation_rules' => [], 'options' => [], 'order' => 1],
                    ['name' => 'Telefon Numarası', 'slug' => 'phone', 'type' => 'phone', 'validation_rules' => [], 'options' => [], 'order' => 2],
                    ['name' => 'E-posta Adresi', 'slug' => 'email', 'type' => 'email', 'validation_rules' => [], 'options' => [], 'order' => 3],
                    ['name' => 'Google Harita Linki', 'slug' => 'map_url', 'type' => 'url', 'validation_rules' => [], 'options' => [], 'order' => 4],
                    ['name' => 'Facebook URL', 'slug' => 'social_facebook', 'type' => 'url', 'validation_rules' => [], 'options' => [], 'order' => 5],
                    ['name' => 'Instagram URL', 'slug' => 'social_instagram', 'type' => 'url', 'validation_rules' => [], 'options' => [], 'order' => 6],
                ]
            ],
            [
                'name' => 'Gizlilik & KVKK',
                'slug' => 'legal-pages',
                'description' => 'Hukuki metinlerin ve kullanıcı sözleşmelerinin yönetildiği tekil metin alanları.',
                'is_collection' => false,
                'settings' => [
                    'icon' => 'Settings2',
                    'color' => '#64748b', // Slate
                    'seo_enabled' => true,
                    'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
                ],
                'fields' => [
                    ['name' => 'Gizlilik Sözleşmesi', 'slug' => 'privacy_policy', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 1],
                    ['name' => 'KVKK Aydınlatma Metni', 'slug' => 'kvkk_consent', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 2],
                    ['name' => 'Kullanım Koşulları', 'slug' => 'terms_of_use', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 3],
                ]
            ],

            // --- 2. COLLECTION TYPES ---
            [
                'name' => 'Blog / Haberler',
                'slug' => 'blog',
                'description' => 'Başlık, içerik, kapak görseli, okuma süresi ve yayın tarihi gibi alanları barındıran dinamik haber ve makale yapısı.',
                'is_collection' => true,
                'settings' => [
                    'icon' => 'Sparkles',
                    'color' => '#f97316', // Orange
                    'seo_enabled' => true,
                    'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
                ],
                'fields' => [
                    ['name' => 'Başlık', 'slug' => 'title', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 1],
                    ['name' => 'İçerik', 'slug' => 'content', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 2],
                    ['name' => 'Kapak Görseli', 'slug' => 'cover_image', 'type' => 'media', 'validation_rules' => [], 'options' => [], 'order' => 3],
                    ['name' => 'Okuma Süresi (Dakika)', 'slug' => 'reading_time', 'type' => 'number', 'validation_rules' => [], 'options' => [], 'order' => 4],
                    ['name' => 'Yayın Tarihi', 'slug' => 'publish_date', 'type' => 'date', 'validation_rules' => [], 'options' => [], 'order' => 5],
                ]
            ],
            [
                'name' => 'Kategoriler',
                'slug' => 'categories',
                'description' => 'Blog yazılarını, ürünleri veya projeleri gruplamak için kullanılan etiketleme şablonu.',
                'is_collection' => true,
                'settings' => [
                    'icon' => 'Database',
                    'color' => '#3b82f6', // Blue
                    'seo_enabled' => false,
                    'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
                ],
                'fields' => [
                    ['name' => 'Kategori Adı', 'slug' => 'name', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 1],
                    ['name' => 'Kategori Slug Key', 'slug' => 'slug', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 2],
                    ['name' => 'Açıklama', 'slug' => 'description', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 3],
                ]
            ],
            [
                'name' => 'Hizmetler / Ürünler',
                'slug' => 'services',
                'description' => 'Firmanın sunduğu hizmetlerin veya ürünlerin detay sayfaları (Hizmet Adı, İkon, Detaylı Açıklama, Görseller).',
                'is_collection' => true,
                'settings' => [
                    'icon' => 'Link2',
                    'color' => '#14b8a6', // Teal
                    'seo_enabled' => true,
                    'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
                ],
                'fields' => [
                    ['name' => 'Hizmet/Ürün Adı', 'slug' => 'name', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 1],
                    ['name' => 'Detaylı Açıklama', 'slug' => 'description', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 2],
                    ['name' => 'İkon Sınıfı', 'slug' => 'icon', 'type' => 'string', 'validation_rules' => [], 'options' => [], 'order' => 3],
                    ['name' => 'Görseller', 'slug' => 'gallery', 'type' => 'gallery', 'validation_rules' => [], 'options' => [], 'order' => 4],
                ]
            ],
            [
                'name' => 'Ekibimiz',
                'slug' => 'team-members',
                'description' => 'Şirket çalışanlarının veya yöneticilerin listelendiği şablon (Ad Soyad, Unvan, Profil Fotoğrafı, LinkedIn Linki).',
                'is_collection' => true,
                'settings' => [
                    'icon' => 'Eye',
                    'color' => '#10b981', // Green
                    'seo_enabled' => false,
                    'localization' => ['enabled' => false, 'default_lang' => 'tr', 'supported_langs' => ['tr']],
                ],
                'fields' => [
                    ['name' => 'Ad Soyad', 'slug' => 'name', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 1],
                    ['name' => 'Unvan', 'slug' => 'title', 'type' => 'string', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 2],
                    ['name' => 'Profil Fotoğrafı', 'slug' => 'photo', 'type' => 'media', 'validation_rules' => [], 'options' => [], 'order' => 3],
                    ['name' => 'LinkedIn Profil Linki', 'slug' => 'linkedin_url', 'type' => 'url', 'validation_rules' => [], 'options' => [], 'order' => 4],
                ]
            ],
            [
                'name' => 'Projeler / Portfolyo',
                'slug' => 'projects',
                'description' => 'Tamamlanan işlerin sergilendiği yapı (Proje Adı, Kategori, Tamamlanma Tarihi, Proje Galerisi).',
                'is_collection' => true,
                'settings' => [
                    'icon' => 'Globe',
                    'color' => '#8b5cf6', // Purple
                    'seo_enabled' => true,
                    'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
                ],
                'fields' => [
                    ['name' => 'Proje Adı', 'slug' => 'name', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 1],
                    ['name' => 'Tamamlanma Tarihi', 'slug' => 'completion_date', 'type' => 'date', 'validation_rules' => [], 'options' => [], 'order' => 2],
                    ['name' => 'Proje Galerisi', 'slug' => 'gallery', 'type' => 'gallery', 'validation_rules' => [], 'options' => [], 'order' => 3],
                    ['name' => 'Açıklama', 'slug' => 'description', 'type' => 'text', 'validation_rules' => [], 'options' => ['localized' => true], 'order' => 4],
                ]
            ],
            [
                'name' => 'Sıkça Sorulan Sorular',
                'slug' => 'faq',
                'description' => 'Sitedeki soru-cevap akışını yönetmek için tekrarlanan "Soru" ve "Cevap" alanlarından oluşan koleksiyon.',
                'is_collection' => true,
                'settings' => [
                    'icon' => 'Sliders',
                    'color' => '#f59e0b', // Yellow
                    'seo_enabled' => false,
                    'localization' => ['enabled' => true, 'default_lang' => 'tr', 'supported_langs' => ['tr', 'en']],
                ],
                'fields' => [
                    ['name' => 'Soru', 'slug' => 'question', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 1],
                    ['name' => 'Cevap', 'slug' => 'answer', 'type' => 'text', 'validation_rules' => ['required' => true], 'options' => ['localized' => true], 'order' => 2],
                ]
            ],
            [
                'name' => 'Müşteri Yorumları',
                'slug' => 'testimonials',
                'description' => 'Referans olan kişilerin veya markaların geri bildirimlerini tutan şablon (Müşteri Adı, Şirketi, Yorumu, Logosu).',
                'is_collection' => true,
                'settings' => [
                    'icon' => 'Sparkles',
                    'color' => '#ec4899', // Pink
                    'seo_enabled' => false,
                    'localization' => ['enabled' => false, 'default_lang' => 'tr', 'supported_langs' => ['tr']],
                ],
                'fields' => [
                    ['name' => 'Müşteri Adı', 'slug' => 'client_name', 'type' => 'string', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 1],
                    ['name' => 'Şirketi', 'slug' => 'company_name', 'type' => 'string', 'validation_rules' => [], 'options' => [], 'order' => 2],
                    ['name' => 'Yorumu', 'slug' => 'feedback', 'type' => 'text', 'validation_rules' => ['required' => true], 'options' => [], 'order' => 3],
                    ['name' => 'Logo/Profil', 'slug' => 'logo', 'type' => 'media', 'validation_rules' => [], 'options' => [], 'order' => 4],
                ]
            ],
        ];

        foreach ($contentTypes as $typeData) {
            $fields = $typeData['fields'];
            unset($typeData['fields']);

            // Create or update content type
            $contentType = ContentType::updateOrCreate(
                ['slug' => $typeData['slug']],
                $typeData
            );

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

            // Clean up any extra fields
            $contentType->fields()->whereNotIn('slug', $incomingSlugs)->delete();
        }
    }
}
