'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import PremiumButton from '@/components/ui/premium-button';

export const blockConfig = {
  type: 'video_hero',
  name: 'Video Giriş (Hero)',
  description: 'Otomatik döngülü arka plan videosuna sahip büyük başlık alanı.',
  contentFields: [
    {
      key: 'heading',
      label: 'Giriş Başlığı',
      type: 'text',
      default: 'Yeni Global Video Banner Başlığı'
    },
    {
      key: 'subtitle',
      label: 'Giriş Alt Açıklaması',
      type: 'textarea',
      default: 'Otomatik döngülü arka plan videosuna sahip yeni global banner.'
    },
    {
      key: 'button_text',
      label: 'Buton Metni',
      type: 'text',
      default: 'Hemen Keşfet'
    },
    {
      key: 'button_link',
      label: 'Buton Linki (URL)',
      type: 'link',
      default: { type: 'custom', url: '/turlar', target: '_self' }
    },
    {
      key: 'video_file_id',
      label: 'Arka Plan Videosu',
      type: 'media',
      mediaType: 'video',
      default: null
    }
  ],
  styleFields: [
    {
      key: 'text_align',
      label: 'Metin Hizalaması',
      type: 'select',
      options: [
        { value: 'left', label: 'Sola Hizalı' },
        { value: 'center', label: 'Ortalanmış' },
        { value: 'right', label: 'Sağa Hizalı' }
      ],
      default: 'center'
    },
    {
      key: 'height',
      label: 'Bölüm Yüksekliği',
      type: 'select',
      options: [
        { value: '50vh', label: 'Kısa (50vh)' },
        { value: '70vh', label: 'Orta (70vh)' },
        { value: '100vh', label: 'Tam Ekran (100vh)' }
      ],
      default: '70vh'
    },
    {
      key: 'overlay_color',
      label: 'Overlay Rengi (Hex)',
      type: 'color',
      default: '#09090b'
    },
    {
      key: 'overlay_opacity',
      label: 'Overlay Opaklığı (%)',
      type: 'number',
      min: 0,
      max: 100,
      default: 50
    }
  ]
};

export default function VideoHero({ data, locale = 'tr', previewDevice = 'desktop' }) {
  const fields = data?.content || {};
  const styles = data?.styles || {};
  const forceMobile = previewDevice === 'mobile' || previewDevice === 'tablet';

  const [resolvedVideoUrl, setResolvedVideoUrl] = useState('');
  const videoRef = useRef(null);

  // Extract fields
  const heading = fields.heading || fields.title || '';
  const subtitle = fields.subtitle || '';
  const buttonText = fields.button_text || '';
  const rawButtonLink = fields.button_link || '#';

  const buttonLinkObj = typeof rawButtonLink === 'object' && rawButtonLink !== null
    ? { url: '#', target: '_self', ...rawButtonLink }
    : { url: rawButtonLink || '#', target: '_self' };

  // Resolve video url (could be a local media ID or external URL)
  useEffect(() => {
    const rawVideo = fields.video_url || fields.video_file_id || fields.video_file;
    if (rawVideo && (typeof rawVideo === 'number' || (typeof rawVideo === 'string' && /^\d+$/.test(rawVideo)))) {
      apiFetch(`/api/public/media/${rawVideo}`)
        .then(res => res.json())
        .then(json => {
          if (json.data && json.data.url) {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
            const fullUrl = json.data.url.startsWith('http') ? json.data.url : `${backendUrl}${json.data.url}`;
            setResolvedVideoUrl(fullUrl);
          }
        })
        .catch(err => console.error('Error loading video file:', err));
    } else if (rawVideo && typeof rawVideo === 'object' && rawVideo.url) {
      setResolvedVideoUrl(rawVideo.url);
    } else if (rawVideo && typeof rawVideo === 'string') {
      setResolvedVideoUrl(rawVideo);
    } else {
      // Fallback stock background video
      setResolvedVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4');
    }
  }, [fields.video_url, fields.video_file_id, fields.video_file]);

  // Autoplay fix for React/HTML5 videos
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Autoplay was prevented by browser security:', err);
        });
      }
    }
  }, [resolvedVideoUrl]);

  const overlayOpacity = styles.overlay_opacity !== undefined ? Number(styles.overlay_opacity) / 100 : 0.3;
  const overlayColor = styles.overlay_color || '#09090b'; // Default dark color (zinc-950)
  const heightStyle = styles.height || '70vh';
  const textAlignClass = styles.text_align === 'left' ? 'text-left items-start' : styles.text_align === 'right' ? 'text-right items-end' : 'text-center items-center';

  return (
    <section 
      style={{ minHeight: heightStyle }}
      className="relative w-full flex items-center justify-center overflow-hidden bg-zinc-950 text-white shrink-0 select-none"
    >
      {/* Background Video */}
      {resolvedVideoUrl && (
        <div className="absolute inset-0 z-0">
          <video
            key={resolvedVideoUrl}
            ref={videoRef}
            src={resolvedVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-85"
          />
        </div>
      )}

      {/* Semi-transparent Overlay */}
      <div 
        style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
        className="absolute inset-0 z-10 transition-all duration-300"
      />

      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-20 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl z-20 pointer-events-none" />

      {/* Main Content Container */}
      <div className="container relative z-30 mx-auto px-6 max-w-4xl flex flex-col justify-center h-full">
        <div className={`flex flex-col ${forceMobile ? 'gap-4' : 'gap-4 sm:gap-6'} max-w-2xl mx-auto w-full ${textAlignClass}`}>
          {heading && (
            <h1 className={`${forceMobile ? 'text-[28px]' : 'text-[28px] sm:text-5xl'} font-extrabold tracking-tight text-white leading-tight drop-shadow-md`}>
              {heading}
            </h1>
          )}
          
          {subtitle && (
            <p className={`${forceMobile ? 'text-base' : 'text-base sm:text-lg'} text-zinc-300 leading-relaxed max-w-xl drop-shadow-xs`}>
              {subtitle}
            </p>
          )}

          {buttonText && (
            <div className="pt-2">
              <PremiumButton
                asChild
                className={`${forceMobile ? 'w-full' : 'w-full sm:w-auto'}`}
              >
                <Link href={buttonLinkObj.url} target={buttonLinkObj.target}>
                  {buttonText}
                </Link>
              </PremiumButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
