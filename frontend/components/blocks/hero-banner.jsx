'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, X, Search, MapPin, Calendar, Compass, Star, Code, Palette, BarChart, Shield, Cloud, Terminal, Cpu, Check, Users, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroBanner({ data, locale = 'tr' }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search Focused States
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  // Video Popup State
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Tabbed Interactive Layout State
  const [activeAudience, setActiveAudience] = useState('dev');

  const fields = data?.data || {};
  const variant = data?.variant || 'minimal_centered';
  
  // Extract fields
  const heading = getLocalized(fields.heading, locale);
  const subtitle = getLocalized(fields.subtitle, locale);
  const ctaText = getLocalized(fields.cta_text || fields.button_text, locale);
  const ctaUrl = fields.cta_link || fields.button_url || '#';
  const bgImage = fields.background_image?.url || fields.background?.url || null;

  // Slider Carousel State & Slides Logic
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      heading: heading,
      subtitle: subtitle,
      bgImage: bgImage,
      ctaText: ctaText,
      ctaUrl: ctaUrl,
    },
    {
      heading: locale === 'tr' ? 'Geleceğin Teknolojisiyle Tanışın' : 'Meet the Technology of the Future',
      subtitle: locale === 'tr' ? 'Yapay zeka entegrasyonu ve üstün altyapı performansı tek bir platformda.' : 'AI integration and superior infrastructure performance in a single platform.',
      bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      ctaText: locale === 'tr' ? 'Daha Fazla Bilgi' : 'Learn More',
      ctaUrl: '#',
    },
    {
      heading: locale === 'tr' ? 'İş Akışlarınızı Otomatize Edin' : 'Automate Your Workflows',
      subtitle: locale === 'tr' ? 'Yinelenen görevleri ortadan kaldırın ve üretkenliğinizi iki katına çıkarın.' : 'Eliminate repetitive tasks and double your productivity.',
      bgImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      ctaText: locale === 'tr' ? 'Ücretsiz Başlayın' : 'Start Free',
      ctaUrl: '#',
    }
  ];

  useEffect(() => {
    if (variant !== 'slider_carousel') return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [variant, slides.length]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubscribed(true);
      setEmail('');
    }, 1000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchSubmitted(true);
    setTimeout(() => {
      setSearchSubmitted(false);
    }, 3500);
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center py-20 overflow-hidden bg-zinc-950 text-white">
      {/* Background Image with Gradient Overlay */}
      {variant === 'slider_carousel' ? (
        <div className="absolute inset-0 z-0">
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              {slide.bgImage ? (
                <img
                  src={slide.bgImage}
                  alt={slide.heading}
                  className="w-full h-full object-cover opacity-25 scale-105"
                />
              ) : (
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-zinc-950 to-zinc-950" />
              )}
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/90 to-zinc-950" />
        </div>
      ) : bgImage ? (
        <div className="absolute inset-0 z-0">
          <img
            src={bgImage}
            alt={heading}
            className="w-full h-full object-cover opacity-20 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/90 to-zinc-950" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-zinc-950 to-zinc-950" />
      )}

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />

      {variant === 'image_supported' && (
        <div className="container relative z-10 mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center text-left">
            <div className="md:col-span-7 space-y-6 animate-fade-in">
              {heading && (
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                  {heading}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-zinc-300 leading-relaxed drop-shadow-xs max-w-xl">
                  {subtitle}
                </p>
              )}
              {ctaText && (
                <div className="pt-2">
                  <Link
                    href={ctaUrl}
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
                  >
                    {ctaText}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              )}
            </div>
            <div className="md:col-span-5 flex justify-center animate-fade-in-delayed">
              <div className="w-full max-w-md aspect-video bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-primary/5 hover:scale-[1.02] hover:border-primary/20 transition-all duration-500 relative group">
                {bgImage ? (
                  <img
                    src={bgImage}
                    alt={heading}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center text-zinc-600 font-bold text-sm">
                    🖼️ Görsel Seçilmedi
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === 'form_input' && (
        <div className="container relative z-10 mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center text-left">
            <div className="md:col-span-7 space-y-6 animate-fade-in">
              {heading && (
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                  {heading}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-zinc-300 leading-relaxed drop-shadow-xs max-w-xl">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="md:col-span-5 animate-fade-in-delayed">
              <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-8 rounded-3xl shadow-2xl shadow-primary/5 space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">Bültenimize Katılın</h3>
                  <p className="text-xs text-zinc-400">En son güncellemeler ve ayrıcalıklı haberlerden ilk siz haberdar olun.</p>
                </div>
                
                {subscribed ? (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 text-center space-y-2 animate-scale-up">
                    <span className="text-2xl">🎉</span>
                    <h4 className="text-sm font-bold text-primary">Aboneliğiniz Tamamlandı!</h4>
                    <p className="text-xs text-zinc-400">Bültenimize başarıyla kaydoldunuz. Teşekkür ederiz.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div className="space-y-1">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="E-posta adresiniz"
                        className="w-full h-12 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:border-primary/40 focus:outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Kaydediliyor...' : 'Abone Ol'}
                    </button>
                  </form>
                )}
                
                <p className="text-[10px] text-zinc-500 text-center leading-normal">
                  Kayıt olarak gizlilik şartlarını ve verilerinizin işlenmesini kabul etmiş olursunuz.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === 'video_popup' && (
        <div className="container relative z-10 mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center text-left">
            <div className="md:col-span-6 space-y-6 animate-fade-in">
              {heading && (
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                  {heading}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-zinc-300 leading-relaxed drop-shadow-xs max-w-xl">
                  {subtitle}
                </p>
              )}
              {ctaText && (
                <div className="pt-2">
                  <Link
                    href={ctaUrl}
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
                  >
                    {ctaText}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              )}
            </div>
            <div className="md:col-span-6 flex justify-center animate-fade-in-delayed">
              <div 
                onClick={() => setIsVideoOpen(true)}
                className="w-full aspect-video bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-primary/5 hover:scale-[1.02] hover:border-primary/20 transition-all duration-500 relative group cursor-pointer"
              >
                {bgImage ? (
                  <img
                    src={bgImage}
                    alt={heading}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center" />
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:border-primary/20 transition-all duration-300 shadow-xl shadow-black/30">
                    <Play className="size-6 text-white fill-white translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === 'search_focused' && (
        <div className="container relative z-10 mx-auto px-6 text-center space-y-10 max-w-5xl animate-fade-in">
          <div className="space-y-6">
            {heading && (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                {heading}
              </h1>
            )}
            {subtitle && (
              <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed drop-shadow-xs">
                {subtitle}
              </p>
            )}
          </div>

          {/* Premium Multi-field Search Bar */}
          <div className="max-w-4xl mx-auto bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 p-4 rounded-2xl md:rounded-full shadow-2xl shadow-black/50">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Location Input */}
              <div className="flex-1 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-zinc-850 text-left">
                <MapPin className="size-5 text-primary shrink-0" />
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Lokasyon</label>
                  <input 
                    type="text" 
                    placeholder="Nereye gitmek istersiniz?" 
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full bg-transparent border-0 p-0 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-0 mt-0.5"
                  />
                </div>
              </div>

              {/* Date Input */}
              <div className="flex-1 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-zinc-850 text-left">
                <Calendar className="size-5 text-purple-500 shrink-0" />
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tarih Aralığı</label>
                  <input 
                    type="text" 
                    placeholder="Tarihleri Seçin" 
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full bg-transparent border-0 p-0 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-0 mt-0.5"
                  />
                </div>
              </div>

              {/* Category selector */}
              <div className="flex-1 flex items-center gap-3 px-4 py-2 text-left">
                <Compass className="size-5 text-emerald-500 shrink-0" />
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Kategori</label>
                  <select 
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="w-full bg-transparent border-0 p-0 text-sm text-white focus:outline-none focus:ring-0 mt-0.5 cursor-pointer"
                    style={{ WebkitAppearance: 'none' }}
                  >
                    <option value="all" className="bg-zinc-950">Tüm Kategoriler</option>
                    <option value="hotel" className="bg-zinc-950">Konaklama</option>
                    <option value="experience" className="bg-zinc-950">Aktiviteler</option>
                    <option value="restaurant" className="bg-zinc-950">Yeme-İçme</option>
                  </select>
                </div>
              </div>

              {/* Search button */}
              <button 
                type="submit"
                className="h-12 md:h-14 px-8 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl md:rounded-full flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:scale-102 transition-all duration-200"
              >
                <Search className="size-4" />
                <span>Arama Yap</span>
              </button>
            </form>
          </div>

          {searchSubmitted && (
            <div className="text-sm font-semibold text-primary animate-pulse">
              🔍 {searchLocation || 'Tüm lokasyonlar'} için arama kriterleri uygulandı!
            </div>
          )}
        </div>
      )}

      {variant === 'dashboard_mockup' && (
        <div className="container relative z-10 mx-auto px-6 text-center space-y-12 max-w-5xl animate-fade-in">
          <div className="space-y-6">
            {heading && (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                {heading}
              </h1>
            )}
            {subtitle && (
              <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed drop-shadow-xs">
                {subtitle}
              </p>
            )}
            {ctaText && (
              <div className="pt-4">
                <Link
                  href={ctaUrl}
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
                >
                  {ctaText}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            )}
          </div>

          {/* Glowing 3D Dashboard Mockup */}
          <div 
            className="w-full max-w-4xl mx-auto bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-2xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-500 overflow-hidden relative"
            style={{ transform: 'perspective(1200px) rotateX(10deg) scale(0.95)' }}
          >
            {/* Dashboard Mock Content */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-zinc-500 ml-4 font-mono">dashboard.corecms.dev</span>
              </div>
              <div className="h-6 w-32 bg-zinc-800 rounded-md animate-pulse" />
            </div>

            <div className="grid grid-cols-3 gap-6 text-left">
              {[
                { label: 'Aylık Trafik', value: '45,231', change: '+12%', color: 'text-emerald-500' },
                { label: 'Dönüşüm Oranı', value: '3.42%', change: '+0.8%', color: 'text-primary' },
                { label: 'Aktif Kullanıcı', value: '1,289', change: '+22%', color: 'text-purple-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-950/50 p-4 border border-zinc-850 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">{stat.label}</span>
                  <div className="text-xl font-extrabold text-white">{stat.value}</div>
                  <span className={`text-xs ${stat.color} font-semibold`}>{stat.change} bu ay</span>
                </div>
              ))}
            </div>

            <div className="mt-6 h-32 bg-zinc-950/30 border border-zinc-850 rounded-xl flex items-end p-4 gap-2">
              {[30, 45, 35, 60, 55, 75, 65, 80, 95, 70, 85, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-primary/50 to-primary rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {variant === 'social_proof' && (
        <div className="container relative z-10 mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center text-left">
            <div className="md:col-span-7 space-y-6 animate-fade-in">
              {/* Rating stars & avatar stack */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex -space-x-3 overflow-hidden">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
                    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80'
                  ].map((url, i) => (
                    <img key={i} src={url} className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" alt="User Avatar" />
                  ))}
                </div>
                <div className="space-y-0.5">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="size-4 fill-amber-500" />)}
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">10,000+ mutlu müşteri değerlendirmesi</p>
                </div>
              </div>

              {heading && (
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                  {heading}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-zinc-300 leading-relaxed drop-shadow-xs max-w-xl">
                  {subtitle}
                </p>
              )}
              {ctaText && (
                <div className="pt-2 flex items-center gap-4">
                  <Link
                    href={ctaUrl}
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
                  >
                    {ctaText}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <span className="text-xs text-zinc-400 font-mono">14 Gün Ücretsiz Deneme</span>
                </div>
              )}
            </div>

            {/* Glowing Brand Badges Cloud */}
            <div className="md:col-span-5 animate-fade-in-delayed">
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-8 rounded-3xl grid grid-cols-2 gap-4">
                {[
                  { icon: Cloud, name: 'AWS Entegrasyonu', label: 'Güvenli Altyapı' },
                  { icon: Shield, name: 'ISO-27001', label: 'Veri Güvenliği' },
                  { icon: Cpu, name: '99.9% Uptime', label: 'Yüksek Performans' },
                  { icon: Users, name: 'GDPR / KVKK', label: 'Uyumlu Sistem' }
                ].map((item, i) => (
                  <div key={i} className="bg-zinc-950/60 p-4 border border-zinc-850 hover:border-primary/40 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all group">
                    <item.icon className="size-6 text-zinc-400 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-bold text-white block">{item.name}</span>
                    <span className="text-[10px] text-zinc-500 font-medium block">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === 'split_screen' && (
        <div className="w-full relative z-10 flex items-center justify-center min-h-[75vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-0 items-stretch min-h-[75vh]">
            {/* Left Content */}
            <div className="flex flex-col justify-center px-8 sm:px-12 md:px-20 py-16 bg-zinc-950 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-primary font-semibold w-fit">
                🚀 Sürüm 2.0 Çıktı!
              </div>
              {heading && (
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                  {heading}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-zinc-300 leading-relaxed drop-shadow-xs max-w-xl">
                  {subtitle}
                </p>
              )}
              {ctaText && (
                <div className="pt-2">
                  <Link
                    href={ctaUrl}
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
                  >
                    {ctaText}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Right Image Full Height */}
            <div className="relative min-h-[350px] md:min-h-full overflow-hidden bg-zinc-900 flex items-center justify-center">
              {bgImage ? (
                <img
                  src={bgImage}
                  alt={heading}
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/60 to-purple-950/60 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl">🎨</div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent md:block hidden" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent md:hidden block" />
            </div>
          </div>
        </div>
      )}

      {variant === 'background_video' && (
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-35"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-32210-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/95 to-zinc-950" />
        </div>
      )}

      {variant === 'background_video' && (
        <div className="container relative z-10 mx-auto px-6 max-w-4xl text-center animate-fade-in">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 sm:p-14 rounded-3xl shadow-2xl space-y-6">
            {heading && (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                {heading}
              </h1>
            )}
            {subtitle && (
              <p className="text-lg text-zinc-300 leading-relaxed max-w-xl mx-auto drop-shadow-xs">
                {subtitle}
              </p>
            )}
            {ctaText && (
              <div className="pt-2">
                <Link
                  href={ctaUrl}
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
                >
                  {ctaText}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {variant === 'metric_cards' && (
        <div className="container relative z-10 mx-auto px-6 text-center space-y-16 max-w-5xl animate-fade-in">
          <div className="space-y-6">
            {heading && (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                {heading}
              </h1>
            )}
            {subtitle && (
              <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed drop-shadow-xs">
                {subtitle}
              </p>
            )}
            {ctaText && (
              <div className="pt-2">
                <Link
                  href={ctaUrl}
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
                >
                  {ctaText}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            )}
          </div>

          {/* Metric Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6">
            {[
              { num: '99.9%', title: 'Uptime Garantisi', desc: 'Kesintisiz servis ve hızlı API yanıtları.' },
              { num: '24/7', title: 'Destek Ekibi', desc: 'Deneyimli mühendislerden canlı teknik yardım.' },
              { num: '100k+', title: 'Geliştirici', desc: 'Dünya çapında bizi tercih eden mutlu topluluk.' }
            ].map((metric, i) => (
              <div key={i} className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl space-y-2 text-center group hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]">
                <div className="text-3xl font-extrabold text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">{metric.num}</div>
                <h4 className="text-sm font-bold text-white">{metric.title}</h4>
                <p className="text-xs text-zinc-400 leading-normal">{metric.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === 'tabbed_interactive' && (
        <div className="container relative z-10 mx-auto px-6 max-w-6xl">
          {/* Tab buttons bar */}
          <div className="flex justify-center gap-2 max-w-md mx-auto mb-10 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
            {[
              { id: 'dev', label: 'Geliştirici', icon: Code },
              { id: 'design', label: 'Tasarımcı', icon: Palette },
              { id: 'market', label: 'Pazarlamacı', icon: BarChart }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAudience(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg transition-all ${
                  activeAudience === tab.id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                <tab.icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab panels switcher layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center text-left">
            <div className="md:col-span-7 space-y-6">
              {activeAudience === 'dev' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
                    API ve SDK'lar ile Geliştiriciler İçin Hız
                  </h2>
                  <p className="text-lg text-zinc-300 leading-relaxed">
                    Gelişmiş REST API entegrasyonu, kapsamlı SDK'lar ve zengin dokümantasyon ile projelerinizi saniyeler içinde yayına alın.
                  </p>
                </div>
              )}
              {activeAudience === 'design' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Sürükle-Bırak ile Tasarımcı Dostu Arayüz
                  </h2>
                  <p className="text-lg text-zinc-300 leading-relaxed">
                    Tasarım-kod eşleşmesini tamamen kusursuzlaştırın. Görsel bileşen sihirbazıyla sürükle bırak tasarım yapın.
                  </p>
                </div>
              )}
              {activeAudience === 'market' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
                    SEO ve Analitik ile Pazarlamacı Odaklı
                  </h2>
                  <p className="text-lg text-zinc-300 leading-relaxed">
                    Dinamik sayfa oluşturucu ve yerleşik SEO yönetim paneli ile sayfa yüklenme hızınızı artırın ve dönüşümlerinizi katlayın.
                  </p>
                </div>
              )}
              {ctaText && (
                <div className="pt-2">
                  <Link
                    href={ctaUrl}
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
                  >
                    {ctaText}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Right side live interactive graphics preview */}
            <div className="md:col-span-5 animate-fade-in">
              <div className="w-full aspect-video bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden group">
                {activeAudience === 'dev' && (
                  <div className="font-mono text-[10px] text-zinc-400 space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                      <span className="text-zinc-500">terminal.js</span>
                      <span className="text-emerald-500">● Connected</span>
                    </div>
                    <p className="text-zinc-500">// Initialize CoreCMS client</p>
                    <p><span className="text-primary">import</span> {"{ CoreCMS }"} <span className="text-primary">from</span> <span className="text-emerald-400">'@core-cms/sdk'</span>;</p>
                    <p><span className="text-primary">const</span> client = <span className="text-primary">new</span> <span className="text-yellow-400">CoreCMS</span>({"{"}</p>
                    <p className="pl-4">apiKey: <span className="text-emerald-400">'cms_live_98ab7f...'</span>,</p>
                    <p className="pl-4">locale: <span className="text-emerald-400">'tr'</span></p>
                    <p>{"});"}</p>
                    <p><span className="text-primary">const</span> page = <span className="text-primary">await</span> client.pages.<span className="text-yellow-400">get</span>(<span className="text-emerald-400">'homepage'</span>);</p>
                  </div>
                )}

                {activeAudience === 'design' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-[10px] text-zinc-500">Tasarım Katmanları</span>
                      <span className="text-[10px] text-purple-400">Figma Sync</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 border border-dashed border-zinc-800 rounded bg-zinc-950/40 space-y-1">
                        <span className="text-[9px] text-zinc-500">Sütun A</span>
                        <div className="h-2 w-full bg-zinc-800 rounded animate-pulse" />
                        <div className="h-1.5 w-2/3 bg-zinc-850 rounded" />
                      </div>
                      <div className="p-2 border border-dashed border-zinc-800 rounded bg-zinc-950/40 space-y-1">
                        <span className="text-[9px] text-zinc-500">Sütun B</span>
                        <div className="h-4 w-full bg-zinc-850 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      {['#6366f1', '#a855f7', '#10b981', '#f59e0b'].map(c => (
                        <div key={c} className="w-5 h-5 rounded-full border border-zinc-800" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                )}

                {activeAudience === 'market' && (
                  <div className="space-y-4 animate-fade-in text-center flex flex-col justify-center h-full">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Dönüşüm Hunisi</span>
                    <div className="flex justify-center items-end gap-2 h-20">
                      {[
                        { val: 100, label: 'Ziyaret' },
                        { val: 40, label: 'Tıklama' },
                        { val: 12, label: 'Kayıt' }
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full bg-gradient-to-t from-primary/30 to-primary rounded" style={{ height: `${item.val}%` }} />
                          <span className="text-[9px] text-zinc-400 font-bold">{item.label}</span>
                          <span className="text-[8px] text-zinc-500">{item.val}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === 'slider_carousel' && (
        <div className="container relative z-10 mx-auto px-6 max-w-5xl text-center min-h-[45vh] flex flex-col justify-between items-center relative group">
          {/* Slides Content */}
          <div className="w-full flex-1 flex items-center justify-center py-6 min-h-[250px]">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`transition-all duration-700 space-y-6 ${
                  index === currentSlide 
                    ? 'opacity-100 translate-y-0 scale-100 block' 
                    : 'opacity-0 translate-y-4 scale-95 hidden'
                }`}
              >
                {slide.heading && (
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                    {slide.heading}
                  </h1>
                )}
                {slide.subtitle && (
                  <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed drop-shadow-xs">
                    {slide.subtitle}
                  </p>
                )}
                {slide.ctaText && (
                  <div className="pt-4">
                    <Link
                      href={slide.ctaUrl}
                      className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
                    >
                      {slide.ctaText}
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-zinc-900/50 border border-zinc-800 hover:bg-primary hover:border-primary text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-black/30 hover:scale-105 z-20"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-zinc-900/50 border border-zinc-800 hover:bg-primary hover:border-primary text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-black/30 hover:scale-105 z-20"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Bullet Indicators */}
          <div className="flex gap-2 justify-center mt-6 z-20">
            {slides.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-primary w-6' 
                    : 'bg-zinc-700 hover:bg-zinc-555 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* default: minimal_centered */}
      {variant !== 'image_supported' && variant !== 'form_input' && variant !== 'video_popup' && variant !== 'search_focused' && variant !== 'dashboard_mockup' && variant !== 'social_proof' && variant !== 'split_screen' && variant !== 'background_video' && variant !== 'metric_cards' && variant !== 'tabbed_interactive' && variant !== 'slider_carousel' && (
        <div className="container relative z-10 mx-auto px-6 text-center space-y-8 max-w-4xl animate-fade-in">
          {heading && (
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
              {heading}
            </h1>
          )}
          {subtitle && (
            <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed drop-shadow-xs">
              {subtitle}
            </p>
          )}
          
          {ctaText && (
            <div className="pt-4 animate-fade-in-delayed">
              <Link
                href={ctaUrl}
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
              >
                {ctaText}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Video Popup Modal */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl aspect-video bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 flex items-center justify-center text-white transition-all"
            >
              <X className="size-5" />
            </button>
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/ysz5S6PUM-U?autoplay=1"
              title="Video Player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </section>
  );
}

// Localized helper
function getLocalized(val, locale) {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}
