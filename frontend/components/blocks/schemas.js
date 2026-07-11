import { blockConfig as videoHeroConfig } from './video-hero';
import { blockConfig as heroBannerConfig } from './hero-banner';
import { blockConfig as glassmorphicGridConfig } from './glassmorphic-grid';

export const BLOCK_SCHEMAS = {
  video_hero: videoHeroConfig,
  hero_banner: heroBannerConfig,
  glassmorphic_grid: glassmorphicGridConfig,
  slider: {
    name: 'Slider / Karusel',
    description: 'Sitenize özel kayan görseller ve rotalar tasarlayın.',
    contentFields: [
      {
        key: 'slides',
        label: 'Slaytlar',
        type: 'json',
        default: [
          {
            title: 'Popüler Rotalar',
            subtitle: 'Sitenize özel rotaları tasarlayın.',
            buttonText: 'Hemen Keşfet',
            buttonLink: { type: 'custom', url: '/turlar', target: '_self' },
            image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
            image_id: null
          }
        ]
      }
    ],
    styleFields: []
  },
  tour_list: {
    name: 'Tur Listesi',
    description: 'En son veya popüler turları listeler.',
    contentFields: [
      {
        key: 'title',
        label: 'Bölüm Başlığı',
        type: 'text',
        default: 'Popüler Turlar'
      },
      {
        key: 'subtitle',
        label: 'Bölüm Alt Başlığı',
        type: 'text',
        default: 'En sevilen maceraları keşfedin'
      }
    ],
    styleFields: []
  },
  posts_blog: {
    name: 'Yazılar & Blog',
    description: 'Son haberleri ve duyuruları listeler.',
    contentFields: [
      {
        key: 'title',
        label: 'Bölüm Başlığı',
        type: 'text',
        default: 'Güncel Duyurular & Blog'
      },
      {
        key: 'subtitle',
        label: 'Bölüm Alt Başlığı',
        type: 'text',
        default: 'Son haberleri ve duyuruları takip edin.'
      }
    ],
    styleFields: []
  },
  statistics_counter: {
    name: 'İstatistik Sayaçları',
    description: 'Farklı başarı sayaçlarını gösterir.',
    contentFields: [
      {
        key: 'stats',
        label: 'İstatistikler',
        type: 'json',
        default: [
          { value: '150+', label: 'Aktif Tur' },
          { value: '15.000+', label: 'Mutlu Müşteri' },
          { value: '25+', label: 'Farklı Ülke' }
        ]
      }
    ],
    styleFields: [
      {
        key: 'bgGradient',
        label: 'Arka Plan Gradyan Sınıfı (Tailwind)',
        type: 'text',
        default: 'from-zinc-900 to-zinc-950'
      },
      {
        key: 'textColor',
        label: 'Yazı Rengi (Hex)',
        type: 'color',
        default: '#ffffff'
      }
    ]
  },
  faq: {
    name: 'Sıkça Sorulan Sorular',
    description: 'Akordeon formatında SSS listesi sunar.',
    contentFields: [
      {
        key: 'title',
        label: 'Bölüm Başlığı',
        type: 'text',
        default: 'Sıkça Sorulan Sorular'
      },
      {
        key: 'items',
        label: 'Sorular ve Cevaplar',
        type: 'json',
        default: [
          { question: 'Rezervasyon iptali nasıl yapılır?', answer: 'Tur tarihine 48 saat kalaya kadar ücretsiz iptal hakkı sunulmaktadır.' }
        ]
      }
    ],
    styleFields: []
  },
  cta_section: {
    name: 'Harekete Geçirici (CTA)',
    description: 'Bülten aboneliği veya buton yönlendirmeli modern CTA alanı.',
    contentFields: [
      {
        key: 'section_title',
        label: 'Başlık',
        type: 'text',
        default: 'Maceraya Katılmaya Hazır mısın?'
      },
      {
        key: 'section_subtitle',
        label: 'Açıklama',
        type: 'textarea',
        default: 'Gelişmelerden anında haberdar olmak ve yarış kayıtları başladığında ilk sen duymak için bültene kaydol.'
      },
      {
        key: 'cta_mode',
        label: 'CTA Modu',
        type: 'select',
        default: 'newsletter'
      },
      {
        key: 'placeholder',
        label: 'E-posta İpucu',
        type: 'text',
        default: 'E-posta adresiniz'
      },
      {
        key: 'button_text',
        label: 'Buton Metni',
        type: 'text',
        default: 'Kayıt Ol'
      },
      {
        key: 'button_link',
        label: 'Buton Linki',
        type: 'text',
        default: '#'
      }
    ],
    styleFields: [
      {
        key: 'layout_style',
        label: 'Görünüm Düzeni',
        type: 'select',
        default: 'centered_gradient'
      },
      {
        key: 'bg_gradient',
        label: 'Arka Plan Gradyan',
        type: 'select',
        default: 'gradient_dark'
      },
      {
        key: 'paddingTop',
        label: 'Üst Boşluk (px)',
        type: 'text',
        default: '64'
      },
      {
        key: 'paddingBottom',
        label: 'Alt Boşluk (px)',
        type: 'text',
        default: '64'
      }
    ]
  },
  video_block: {
    name: 'Video Tanıtımı',
    description: 'Video oynatıcı alanı (Youtube / Vimeo / Mp4).',
    contentFields: [
      {
        key: 'title',
        label: 'Başlık',
        type: 'text',
        default: 'Kurumsal Tanıtım Videosu'
      },
      {
        key: 'video_url',
        label: 'Video Linki (URL)',
        type: 'text',
        default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      }
    ],
    styleFields: [
      {
        key: 'borderRadius',
        label: 'Köşe Yuvarlama (px)',
        type: 'text',
        default: '12'
      },
      {
        key: 'paddingTop',
        label: 'Üst Boşluk (px)',
        type: 'text',
        default: '32'
      },
      {
        key: 'paddingBottom',
        label: 'Alt Boşluk (px)',
        type: 'text',
        default: '32'
      }
    ]
  },
  spacer_divider: {
    name: 'Boşluk & Çizgi',
    description: 'Sayfa bölümleri arasına mesafe veya ayırıcı çizgi ekler.',
    contentFields: [],
    styleFields: [
      {
        key: 'height',
        label: 'Yükseklik (px)',
        type: 'text',
        default: '32'
      },
      {
        key: 'showLine',
        label: 'Çizgi Gösterilsin mi?',
        type: 'boolean',
        default: true
      },
      {
        key: 'lineColor',
        label: 'Çizgi Rengi (Hex)',
        type: 'color',
        default: '#e2e8f0'
      }
    ]
  },
  html_component: {
    name: 'Özel HTML Kod',
    description: 'Sayfaya doğrudan özel HTML/CSS kodu yerleştirmenizi sağlar.',
    contentFields: [
      {
        key: 'html',
        label: 'HTML İçeriği',
        type: 'textarea',
        default: '<div style="padding: 24px; background: #f4f4f5; text-align: center; border-radius: 8px;"><h3>HTML Alanı</h3><p>Kod bloğunuzu buraya yerleştirin.</p></div>'
      }
    ],
    styleFields: [
      {
        key: 'paddingTop',
        label: 'Üst Boşluk (px)',
        type: 'text',
        default: '16'
      },
      {
        key: 'paddingBottom',
        label: 'Alt Boşluk (px)',
        type: 'text',
        default: '16'
      }
    ]
  }
};

export function generateDefaultPayload(type) {
  const schema = BLOCK_SCHEMAS[type];
  if (!schema) return { content: {}, styles: {} };

  const content = {};
  const styles = {};

  if (schema.contentFields) {
    schema.contentFields.forEach(field => {
      content[field.key] = field.default;
    });
  }

  if (schema.styleFields) {
    schema.styleFields.forEach(field => {
      styles[field.key] = field.default;
    });
  }

  return { content, styles };
}
