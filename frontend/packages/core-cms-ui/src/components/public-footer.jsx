'use client';

import Link from 'next/link';
import { Container } from './container';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Send } from 'lucide-react';

// Helper to resolve localized values
function getLocalizedValue(value, lang = 'tr') {
  if (!value) return '';
  if (typeof value === 'object') {
    return value[lang] || value['tr'] || value['en'] || '';
  }
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object') {
      return parsed[lang] || parsed['tr'] || parsed['en'] || '';
    }
  } catch (e) {}
  return String(value);
}

export default function PublicFooter({ settings, menuItems = null, locale = 'tr' }) {
  // Resolve localized site name
  const rawSiteName = settings['site.name'];
  const siteName = getLocalizedValue(rawSiteName, locale) || 'Core CMS';

  // Read theme configurations from frontend.system_settings
  let frontSettings = settings['frontend.system_settings'] || {};
  if (typeof frontSettings === 'string') {
    try {
      frontSettings = JSON.parse(frontSettings);
    } catch (e) {
      frontSettings = {};
    }
  }

  // Footer Description overrides, fallback to site.description
  const footerDescTr = frontSettings.footerDescTr || '';
  const footerDescEn = frontSettings.footerDescEn || '';
  const fallbackDesc = getLocalizedValue(settings['site.description'], locale);
  const footerDesc = locale === 'en' 
    ? (footerDescEn || footerDescTr || fallbackDesc || '') 
    : (footerDescTr || footerDescEn || fallbackDesc || '');

  // Toggles
  const isNewsletterActive = frontSettings.newsletterActive !== false;
  const showContact = frontSettings.footerShowContact !== false;
  const showSocial = frontSettings.footerShowSocial !== false;

  // Contact info
  const phone = settings['site.contact_phone'];
  const email = settings['site.contact_email'];
  const address = frontSettings.address || '';

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

  const hasSocialLinks = socialLinks.facebook || socialLinks.twitter || socialLinks.instagram;

  // Determine grid columns dynamically based on active columns
  let colsCount = 2; // Brand column + Quick links column are always active
  if (showContact && (phone || email || address)) colsCount++;
  if (isNewsletterActive) colsCount++;

  const gridClass = colsCount === 4 
    ? 'grid-cols-1 md:grid-cols-4' 
    : colsCount === 3 
      ? 'grid-cols-1 md:grid-cols-3' 
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <footer className="bg-[#03112b] dark:bg-slate-950 text-slate-300 border-t border-[#102d59] dark:border-border/60 pt-16 pb-12 text-sm select-none transition-colors duration-200">
      <Container className={`grid gap-12 pb-12 border-b border-[#102d59]/60 dark:border-border/40 ${gridClass}`}>
        
        {/* Brand & Description */}
        <div className="space-y-4">
          <Link href="/" className="font-bold text-2xl tracking-tight text-white hover:opacity-90 transition-opacity">
            {siteName}
          </Link>
          {footerDesc && (
            <p className="text-slate-300 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              {footerDesc}
            </p>
          )}
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">Hızlı Linkler</h4>
          <nav className="flex flex-col gap-3 text-sm text-slate-300">
            {menuItems && Array.isArray(menuItems) && menuItems.length > 0 ? (
              menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.url || '#'}
                  target={item.target || '_self'}
                  className="hover:text-white hover:translate-x-1.5 transition-all duration-200 py-0.5"
                >
                  {getLocalizedValue(item.title, locale)}
                </Link>
              ))
            ) : (
              <>
                <Link href="/blog" className="hover:text-white hover:translate-x-1.5 transition-all duration-200 py-0.5">Blog</Link>
                <Link href="/services" className="hover:text-white hover:translate-x-1.5 transition-all duration-200 py-0.5">Hizmetler</Link>
                <Link href="/about-us" className="hover:text-white hover:translate-x-1.5 transition-all duration-200 py-0.5">Hakkımızda</Link>
                <Link href="/contact" className="hover:text-white hover:translate-x-1.5 transition-all duration-200 py-0.5">İletişim</Link>
              </>
            )}
          </nav>
        </div>

        {/* Contact Info (Conditional) */}
        {showContact && (phone || email || address) && (
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">İletişim Bilgileri</h4>
            <div className="space-y-4 text-sm text-slate-300">
              {phone && (
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-sky-400 shrink-0" />
                  <a href={`tel:${phone}`} className="hover:text-white hover:underline transition-colors">{phone}</a>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-sky-400 shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white hover:underline transition-colors">{email}</a>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-3">
                  <MapPin className="size-4.5 text-sky-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Newsletter Signup (Conditional) */}
        {isNewsletterActive && (
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">E-Bülten Kaydı</h4>
            <p className="text-slate-300 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              En son haberler, etkinlikler ve kampanyalardan haberdar olmak için bültenimize abone olun.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex max-w-sm bg-[#051838] dark:bg-slate-900/50 border border-[#14376c] dark:border-border rounded-xl p-1.5 overflow-hidden transition-all duration-200 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="w-full bg-transparent px-3 text-sm outline-none text-white placeholder:text-slate-400"
                required
              />
              <button
                type="submit"
                className="size-9 shrink-0 bg-sky-500 hover:bg-sky-400 text-white rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        )}
      </Container>

      {/* Bottom Bar */}
      <Container className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 text-sm text-slate-400">
        <div>
          © {new Date().getFullYear()} {siteName}. Tüm Hakları Saklıdır.
        </div>
        
        {/* Social Icons (Conditional) */}
        {showSocial && hasSocialLinks && (
          <div className="flex items-center gap-5">
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">
                <Facebook className="size-5" />
              </a>
            )}
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">
                <Twitter className="size-5" />
              </a>
            )}
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">
                <Instagram className="size-5" />
              </a>
            )}
          </div>
        )}

        <div className="flex gap-5">
          <Link href="/privacy-policy" className="hover:underline hover:text-white transition-colors duration-200">Gizlilik Sözleşmesi</Link>
          <Link href="/terms-of-use" className="hover:underline hover:text-white transition-colors duration-200">Kullanım Koşulları</Link>
        </div>
      </Container>
    </footer>
  );
}
