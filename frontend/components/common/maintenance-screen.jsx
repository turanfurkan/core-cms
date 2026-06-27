import Link from 'next/link';
import { Settings, Phone, Mail, MapPin, Facebook, Twitter, Instagram, ArrowRight, ShieldCheck } from 'lucide-react';

export default function MaintenanceScreen({ settings, isOffline = false, locale = 'tr' }) {
  // Resolve localized site name
  const rawSiteName = settings['site.name'];
  let siteName = 'Core CMS';
  if (rawSiteName) {
    if (typeof rawSiteName === 'object') {
      siteName = rawSiteName[locale] || rawSiteName['tr'] || rawSiteName['en'] || 'Core CMS';
    } else {
      try {
        const parsed = JSON.parse(rawSiteName);
        siteName = parsed[locale] || parsed['tr'] || parsed['en'] || 'Core CMS';
      } catch (e) {}
    }
  }

  // Contact info
  const phone = settings['site.contact_phone'];
  const email = settings['site.contact_email'];
  
  let address = '';
  const frontSettings = settings['frontend.system_settings'] || {};
  if (typeof frontSettings === 'object') {
    address = frontSettings.address || '';
  } else if (typeof frontSettings === 'string') {
    try {
      const parsed = JSON.parse(frontSettings);
      address = parsed.address || '';
    } catch (e) {}
  }

  // Social links
  let socialLinks = { facebook: '', twitter: '', instagram: '' };
  const rawSocial = settings['site.social_links'];
  if (rawSocial) {
    if (typeof rawSocial === 'object') {
      socialLinks = { ...socialLinks, ...rawSocial };
    } else {
      try {
        const parsed = JSON.parse(rawSocial);
        socialLinks = { ...socialLinks, ...parsed };
      } catch (e) {}
    }
  }

  const title = isOffline ? 'Web Sitemiz Geçici Olarak Kapalı' : 'Bakım Modundayız';
  const description = isOffline 
    ? 'Daha iyi bir hizmet sunabilmek amacıyla web sitemiz geçici olarak kapatılmıştır. Lütfen daha sonra tekrar ziyaret edin.'
    : 'Sizlere daha iyi bir deneyim sunabilmek amacıyla web sitemizde güncelleme ve bakım çalışmaları yapılmaktadır. Anlayışınız için teşekkür ederiz.';

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-hidden select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
          <div className="size-2 rounded-full bg-primary animate-pulse" />
          {siteName}
        </div>
        <Link 
          href="/auth/login" 
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors bg-zinc-900/60 hover:bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-zinc-800/60 backdrop-blur-md"
        >
          <ShieldCheck className="size-3.5 text-primary" />
          Yönetim Paneli Girişi
        </Link>
      </header>

      {/* Main Card */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-6 py-12 flex flex-col items-center justify-center grow">
        <div className="w-full bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 sm:p-10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-8">
          
          {/* Animated Cog */}
          <div className="relative size-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Settings className="size-10 text-primary animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center">
              <span className="size-2 rounded-full bg-white animate-ping" />
            </div>
          </div>

          {/* Heading and Description */}
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              {title}
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              {description}
            </p>
          </div>

          {/* Quick Contact Info */}
          {(phone || email || address) && (
            <div className="w-full border-t border-zinc-800/60 pt-6 space-y-3.5 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">Bizimle İletişime Geçin</p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
                {phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-primary" />
                    <a href={`tel:${phone}`} className="hover:text-white transition-colors">{phone}</a>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-primary" />
                    <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a>
                  </div>
                )}
              </div>
              {address && (
                <div className="flex justify-center items-start gap-2 max-w-sm mx-auto text-center">
                  <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{address}</span>
                </div>
              )}
            </div>
          )}

          {/* Social Links */}
          {(socialLinks.facebook || socialLinks.twitter || socialLinks.instagram) && (
            <div className="w-full border-t border-zinc-800/60 pt-6 flex justify-center gap-5">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-primary flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all">
                  <Facebook className="size-4" />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-primary flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all">
                  <Twitter className="size-4" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-primary flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all">
                  <Instagram className="size-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} {siteName}. Tüm Hakları Saklıdır.
      </footer>
    </div>
  );
}
