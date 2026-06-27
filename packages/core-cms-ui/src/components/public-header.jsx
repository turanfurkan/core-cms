'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useLanguage } from '@/providers/i18n-provider';
import { Phone, Mail, Globe, User, LogOut, Settings, ChevronDown, Clock, Menu, X, LogIn, UserPlus, Zap } from 'lucide-react';
import { Container } from './container';

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

export default function PublicHeader({ settings, menuItems = null, locale: passedLocale = 'tr' }) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const { languageCode, changeLanguage } = useLanguage();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const locale = mounted ? (languageCode || passedLocale || 'tr') : (passedLocale || 'tr');

  const logoUrl = settings['site.logo'];
  
  // Resolve localized site name
  const rawSiteName = settings['site.name'];
  const siteName = getLocalizedValue(rawSiteName, locale) || 'Core CMS';

  // Read header/theme configs from frontend.system_settings
  let frontSettings = settings['frontend.system_settings'] || {};
  if (typeof frontSettings === 'string') {
    try {
      frontSettings = JSON.parse(frontSettings);
    } catch (e) {
      frontSettings = {};
    }
  }

  const logoHeight = (parseInt(frontSettings.logoHeight, 10) || 40) * 1.25;
  const isSticky = frontSettings.headerSticky !== false;

  // Top Bar settings
  const topBarContactShow = !!frontSettings.topBarContactShow;
  const topBarLangShow = !!frontSettings.topBarLangShow;
  const topBarThemeShow = !!frontSettings.topBarThemeShow;
  const phone = settings['site.contact_phone'] || '';
  const email = settings['site.contact_email'] || '';

  // Announcement Bar config
  const announcementActive = !!frontSettings.announcementActive;
  const announcementLink = frontSettings.announcementLink || '';
  const announcementText = locale === 'en' 
    ? (frontSettings.announcementTextEn || frontSettings.announcementTextTr || '') 
    : (frontSettings.announcementTextTr || frontSettings.announcementTextEn || '');

  // Countdown timer config
  const countdownActive = !!frontSettings.countdownActive;
  const targetDateStr = frontSettings.countdownDate || '';
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!countdownActive || !targetDateStr) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDateStr) - +new Date();
      let timeLeftData = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

      if (difference > 0) {
        timeLeftData = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          expired: false,
        };
      }
      return timeLeftData;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownActive, targetDateStr]);

  const showTopBar = topBarContactShow || announcementActive || (countdownActive && !timeLeft.expired) || topBarLangShow || topBarThemeShow;

  // Auth Dropdown state & ref
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (authDropdownRef.current && !authDropdownRef.current.contains(event.target)) {
        setAuthDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // CTA button config
  const ctaActive = !!frontSettings.ctaActive;
  const ctaText = locale === 'en'
    ? (frontSettings.ctaTextEn || frontSettings.ctaTextTr || '')
    : (frontSettings.ctaTextTr || frontSettings.ctaTextEn || '');
  const ctaLink = frontSettings.ctaLink || '';
  
  // CTA Class resolution (Ikas-style rounded capsule)
  let ctaClass = 'text-[13px] lg:text-[14px] font-bold px-6 py-2.5 rounded-full transition-all shadow-md tracking-tight flex items-center gap-1.5 select-none ';
  if (frontSettings.ctaStyle === 'gradient') {
    ctaClass += 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:brightness-110 text-white hover:scale-105 active:scale-95 duration-200';
  } else if (frontSettings.ctaStyle === 'pulse') {
    ctaClass += 'bg-primary text-primary-foreground hover:bg-primary/95 relative overflow-visible after:absolute after:inset-0 after:rounded-full after:border-2 after:border-primary after:animate-ping after:opacity-75';
  } else { // solid
    ctaClass += 'bg-primary text-primary-foreground hover:bg-primary/95';
  }

  // Render navigation items
  const renderNavLinks = () => {
    // If dynamic menu items are fetched and valid, render them
    if (menuItems && Array.isArray(menuItems) && menuItems.length > 0) {
      return menuItems.map((item) => {
        const itemTitle = getLocalizedValue(item.title, locale);
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
          return (
            <div key={item.id} className="relative group flex items-center">
              <button className="hover:text-primary text-foreground/85 dark:text-foreground/90 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors tracking-tight text-[15px] lg:text-[16px]">
                {itemTitle}
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-hover:rotate-180" />
              </button>
              
              {/* Nested Dropdown */}
              <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-popover text-popover-foreground border border-border rounded-xl shadow-lg p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.url || '#'}
                    target={child.target || '_self'}
                    className="block px-3 py-2 rounded-lg text-xs hover:bg-muted hover:text-primary transition-colors font-medium"
                  >
                    {getLocalizedValue(child.title, locale)}
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.url || '#'}
            target={item.target || '_self'}
            className="hover:text-primary text-foreground/85 dark:text-foreground/90 font-semibold transition-colors tracking-tight text-[15px] lg:text-[16px]"
          >
            {itemTitle}
          </Link>
        );
      });
    }

    // Default static fallback links
    return (
      <>
        <Link href="/blog" className="hover:text-primary text-foreground/85 dark:text-foreground/90 font-semibold transition-colors tracking-tight text-[15px] lg:text-[16px]">Blog</Link>
        <Link href="/services" className="hover:text-primary text-foreground/85 dark:text-foreground/90 font-semibold transition-colors tracking-tight text-[15px] lg:text-[16px]">Hizmetler</Link>
        <Link href="/about-us" className="hover:text-primary text-foreground/85 dark:text-foreground/90 font-semibold transition-colors tracking-tight text-[15px] lg:text-[16px]">Hakkımızda</Link>
        <Link href="/contact" className="hover:text-primary text-foreground/85 dark:text-foreground/90 font-semibold transition-colors tracking-tight text-[15px] lg:text-[16px]">İletişim</Link>
      </>
    );
  };

  const renderMobileNavLinks = () => {
    if (menuItems && Array.isArray(menuItems) && menuItems.length > 0) {
      return menuItems.map((item) => {
        const itemTitle = getLocalizedValue(item.title, locale);
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
          return (
            <div key={item.id} className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold px-1">{itemTitle}</span>
              <div className="flex flex-col gap-2 pl-3 border-l border-border/80">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.url || '#'}
                    target={child.target || '_self'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-foreground hover:text-primary transition-colors text-sm py-1 font-medium"
                  >
                    {getLocalizedValue(child.title, locale)}
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.url || '#'}
            target={item.target || '_self'}
            onClick={() => setMobileMenuOpen(false)}
            className="text-foreground hover:text-primary transition-colors py-1 font-medium"
          >
            {itemTitle}
          </Link>
        );
      });
    }

    return (
      <>
        <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-1 font-medium">Blog</Link>
        <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-1 font-medium">Hizmetler</Link>
        <Link href="/about-us" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-1 font-medium">Hakkımızda</Link>
        <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors py-1 font-medium">İletişim</Link>
      </>
    );
  };

  const renderAuthSection = () => {
    if (status === 'loading') {
      return <div className="size-8 rounded-full bg-muted animate-pulse" />;
    }

    if (isAuthenticated) {
      const avatarUrl = session?.user?.avatar || '/media/avatars/300-2.png';
      const name = session?.user?.name || 'Member';
      const email = session?.user?.email || '';
      const isAdmin = session?.user?.role === 'admin' || session?.user?.isAdmin || true;

      return (
        <div className="relative animate-fade-in" ref={authDropdownRef}>
          <button
            onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
            className="flex items-center gap-1.5 focus:outline-none cursor-pointer border border-border/80 dark:border-border/30 px-3.5 py-1.5 rounded-full hover:bg-muted/30 transition-all"
          >
            <img
              src={avatarUrl}
              alt={name}
              className="size-7 rounded-full object-cover shadow-sm"
            />
            <span className="text-[13px] lg:text-[14px] font-bold text-foreground max-w-[100px] truncate">{name}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>

          {authDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-background border border-border rounded-2xl shadow-xl p-2.5 z-[100] animate-fade-in">
              {/* User Info Header */}
              <div className="px-3 py-2 flex items-center gap-2.5 border-b border-border/60 pb-3 mb-2">
                <img src={avatarUrl} alt={name} className="size-10 rounded-full border border-border object-cover" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{name}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{email}</span>
                </div>
              </div>

              {/* Menu Options */}
              <div className="space-y-1">
                {isAdmin && (
                  <Link
                    href="/dashboard"
                    onClick={() => setAuthDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-all"
                  >
                    <Settings className="size-3.5" />
                    <span>Yönetim Paneli</span>
                  </Link>
                )}
                <Link
                  href="/account/home/user-profile"
                  onClick={() => setAuthDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <User className="size-3.5" />
                  <span>Profilim</span>
                </Link>
              </div>

              <div className="border-t border-border/60 my-2" />

              {/* Logout */}
              <button
                onClick={() => {
                  setAuthDropdownOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/5 transition-all cursor-pointer"
              >
                <LogOut className="size-3.5" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          )}
        </div>
      );
    }

    // Guest Auth Links matching Ikas-style capsule design with Icons inside
    return (
      <div className="flex items-center gap-2.5 animate-fade-in">
        <Link
          href="/signin"
          className="border border-border/80 dark:border-border/30 hover:bg-muted/50 text-foreground text-[13px] lg:text-[14px] font-bold px-6 py-2.5 rounded-full transition-all cursor-pointer tracking-tight flex items-center gap-1.5 select-none"
        >
          <LogIn className="size-4 text-muted-foreground" />
          <span>{locale === 'en' ? 'Sign In' : 'Giriş Yap'}</span>
        </Link>
        <Link
          href="/signup"
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] lg:text-[14px] font-bold px-6 py-2.5 rounded-full transition-all shadow-sm cursor-pointer tracking-tight flex items-center gap-1.5 select-none"
        >
          <UserPlus className="size-4" />
          <span>{locale === 'en' ? 'Sign Up' : 'Üye Ol'}</span>
        </Link>
      </div>
    );
  };

  const renderMobileAuthSection = () => {
    if (status === 'loading') {
      return <div className="h-8 w-full bg-muted animate-pulse rounded-full" />;
    }

    if (isAuthenticated) {
      const name = session?.user?.name || 'Member';
      const email = session?.user?.email || '';
      const isAdmin = session?.user?.role === 'admin' || session?.user?.isAdmin || true;

      return (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <img
              src={session?.user?.avatar || '/media/avatars/300-2.png'}
              alt={name}
              className="size-8 rounded-full border border-border object-cover"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground truncate">{name}</span>
              <span className="text-[10px] text-muted-foreground truncate">{email}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 pl-3 border-l border-border/80">
            {isAdmin && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-foreground hover:text-primary text-xs font-semibold py-1.5 flex items-center gap-1.5"
              >
                <Settings className="size-3.5" />
                <span>Yönetim Paneli</span>
              </Link>
            )}
            <Link
              href="/account/home/user-profile"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground hover:text-primary text-xs font-semibold py-1.5 flex items-center gap-1.5"
            >
              <User className="size-3.5" />
              <span>Profilim</span>
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="text-destructive hover:text-destructive/80 text-xs font-bold py-1.5 flex items-center gap-1.5 text-left w-full cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/signin"
          onClick={() => setMobileMenuOpen(false)}
          className="text-center border border-border/80 dark:border-border/30 hover:bg-muted/50 text-foreground text-xs font-semibold px-4 py-2.5 rounded-full transition-all tracking-tight flex items-center justify-center gap-1.5"
        >
          <LogIn className="size-3.5 text-muted-foreground" />
          <span>{locale === 'en' ? 'Sign In' : 'Giriş Yap'}</span>
        </Link>
        <Link
          href="/signup"
          onClick={() => setMobileMenuOpen(false)}
          className="text-center bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-full transition-all shadow-sm tracking-tight flex items-center justify-center gap-1.5"
        >
          <UserPlus className="size-3.5" />
          <span>{locale === 'en' ? 'Sign Up' : 'Üye Ol'}</span>
        </Link>
      </div>
    );
  };

  const dayLabel = locale === 'en' ? 'd' : 'g';
  const hourLabel = locale === 'en' ? 'h' : 'sa';
  const minLabel = locale === 'en' ? 'm' : 'dk';
  const secLabel = locale === 'en' ? 's' : 'sn';

  return (
    <div className={`w-full z-50 ${isSticky ? 'sticky top-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(34, 211, 238, 0.15);
            border-color: rgba(255, 255, 255, 0.15);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.45);
            border-color: rgba(34, 211, 238, 0.6);
          }
        }
        .glow-pulse {
          animation: glowPulse 2.5s infinite ease-in-out;
        }
      `}} />
      {/* Advanced Top Bar */}
      {showTopBar && (
        <div className="bg-[#002254] dark:bg-slate-950 border-b border-white/10 dark:border-border/60 py-3 text-sm select-none shadow-sm transition-colors duration-200">
          <Container className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center w-full">
            {/* Left: Contact info */}
            <div className="flex items-center justify-center md:justify-start gap-5 text-white dark:text-slate-300">
              {topBarContactShow && phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-cyan-200 dark:hover:text-white transition-colors font-semibold text-sm tracking-tight">
                  <Phone className="size-4 text-cyan-300 dark:text-primary shrink-0" />
                  <span>{phone}</span>
                </a>
              )}
              {topBarContactShow && phone && topBarContactShow && email && (
                <span className="w-[1px] h-4 bg-white/20 dark:bg-border/60 hidden sm:inline" />
              )}
              {topBarContactShow && email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-cyan-200 dark:hover:text-white transition-colors font-semibold text-sm tracking-tight">
                  <Mail className="size-4 text-cyan-300 dark:text-primary shrink-0" />
                  <span>{email}</span>
                </a>
              )}
            </div>

            {/* Center: Live countdown or sliding text */}
            <div className="flex items-center justify-center">
              {countdownActive && !timeLeft.expired ? (
                <div className="flex items-center justify-center gap-3.5 select-none">
                  <span className="text-sm font-bold text-white mr-0.5 tracking-tight">
                    {locale === 'en'
                      ? (frontSettings.countdownLabelEn || frontSettings.countdownLabelTr || 'Time Left:')
                      : (frontSettings.countdownLabelTr || frontSettings.countdownLabelEn || 'Büyük Kampanyanın Bitmesine Kalan Süre:')}
                  </span>
                  <div className="flex items-center gap-1.5 text-white dark:text-slate-200">
                    <div className="flex items-center gap-0.5 bg-white/12 dark:bg-slate-900 border border-white/25 dark:border-slate-800 px-2.5 py-1 rounded-md shadow-sm text-sm font-mono font-bold min-w-[34px] justify-center">
                      {String(timeLeft.days).padStart(2, '0')}
                      <span className="text-[10px] font-sans font-normal text-white/80 dark:text-slate-400 ml-0.5">{dayLabel}</span>
                    </div>
                    <span className="text-white/60 dark:text-slate-500 font-bold text-sm mx-0.5">:</span>
                    <div className="flex items-center gap-0.5 bg-white/12 dark:bg-slate-900 border border-white/25 dark:border-slate-800 px-2.5 py-1 rounded-md shadow-sm text-sm font-mono font-bold min-w-[34px] justify-center">
                      {String(timeLeft.hours).padStart(2, '0')}
                      <span className="text-[10px] font-sans font-normal text-white/80 dark:text-slate-400 ml-0.5">{hourLabel}</span>
                    </div>
                    <span className="text-white/60 dark:text-slate-500 font-bold text-sm mx-0.5">:</span>
                    <div className="flex items-center gap-0.5 bg-white/12 dark:bg-slate-900 border border-white/25 dark:border-slate-800 px-2.5 py-1 rounded-md shadow-sm text-sm font-mono font-bold min-w-[34px] justify-center">
                      {String(timeLeft.minutes).padStart(2, '0')}
                      <span className="text-[10px] font-sans font-normal text-white/80 dark:text-slate-400 ml-0.5">{minLabel}</span>
                    </div>
                    <span className="text-white/60 dark:text-slate-500 font-bold text-sm mx-0.5">:</span>
                    <div className="flex items-center gap-0.5 bg-white/12 dark:bg-slate-900 border border-white/25 dark:border-slate-800 px-2.5 py-1 rounded-md shadow-sm text-sm font-mono font-bold min-w-[34px] justify-center text-cyan-300 dark:text-primary animate-pulse">
                      {String(timeLeft.seconds).padStart(2, '0')}
                      <span className="text-[10px] font-sans font-normal text-white/80 dark:text-slate-400 ml-0.5">{secLabel}</span>
                    </div>
                  </div>
                </div>
              ) : announcementActive && announcementText ? (
                announcementLink ? (
                  <Link 
                    href={announcementLink} 
                    className="flex justify-center items-center group transition-all duration-300"
                  >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/15 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-white/20 dark:border-slate-800 rounded-full glow-pulse transition-all duration-300">
                      <span className="relative flex size-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex rounded-full size-2 bg-cyan-300"></span>
                      </span>
                      <span className="text-white group-hover:text-cyan-200 text-sm font-semibold tracking-tight">
                        {announcementText}
                      </span>
                      <svg className="size-4 text-cyan-300 group-hover:translate-x-1 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-full glow-pulse">
                    <span className="relative flex size-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full size-2 bg-cyan-300"></span>
                    </span>
                    <span className="text-sm font-semibold text-white tracking-tight">
                      {announcementText}
                    </span>
                  </span>
                )
              ) : null}
            </div>

            {/* Right: Lang & Theme switcher */}
            <div className="flex items-center justify-center md:justify-end gap-4">
              {topBarLangShow && (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/10 dark:hover:bg-muted text-white hover:text-cyan-100 dark:text-slate-300 dark:hover:text-white text-sm font-semibold cursor-pointer transition-colors">
                    <img
                      src={locale === 'en' ? '/media/flags/united-states.svg' : '/media/flags/turkey.svg'}
                      className="w-4.5 h-4.5 rounded-full object-cover shadow-sm"
                      alt={locale === 'en' ? 'EN' : 'TR'}
                    />
                    <span className="uppercase text-xs tracking-wider font-bold">{locale}</span>
                    <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180 opacity-80" />
                  </button>
                  <div className="absolute right-0 mt-1 min-w-[120px] bg-background text-foreground border border-border rounded-xl shadow-lg p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <button
                      onClick={() => changeLanguage('tr')}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-bold hover:bg-muted transition-colors ${locale === 'tr' ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                    >
                      <img src="/media/flags/turkey.svg" className="w-4 h-4 rounded-full object-cover" alt="TR" />
                      Türkçe
                    </button>
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-bold hover:bg-muted transition-colors ${locale === 'en' ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                    >
                      <img src="/media/flags/united-states.svg" className="w-4 h-4 rounded-full object-cover" alt="EN" />
                      English
                    </button>
                  </div>
                </div>
              )}

            </div>
          </Container>
        </div>
      )}

      {/* Main Header Bar */}
      <header className="border-b border-border/70 py-4 bg-background/95 backdrop-blur-md">
        <Container className="flex justify-between items-center md:grid md:grid-cols-3 gap-4 w-full">
          
          {/* Column 1: Left Logo */}
          <div className="flex justify-start items-center">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={siteName} 
                  className="w-auto object-contain"
                  style={{ height: `${logoHeight}px` }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <span 
                className="font-bold text-2xl tracking-tight text-primary"
                style={logoUrl ? { display: 'none' } : {}}
              >
                {siteName}
              </span>
            </Link>
          </div>
 
          {/* Column 2: Center Navigation Menu */}
          <div className="hidden md:flex justify-center items-center">
            <nav className="flex gap-7 lg:gap-9 text-[15px] lg:text-[16px] font-semibold items-center whitespace-nowrap">
              {renderNavLinks()}
              
              {/* Inline CTA Button (Capsule design) */}
              {ctaActive && ctaText && (
                <Link
                  href={ctaLink || '#'}
                  className={ctaClass}
                >
                  <span>{ctaText}</span>
                  <Zap className="size-3.5 fill-current" />
                </Link>
              )}
            </nav>
          </div>

          {/* Column 3: Right Actions & Hamburger */}
          <div className="flex justify-end items-center gap-3">
            <div className="hidden md:block">
              {renderAuthSection()}
            </div>

            {/* Hamburger Menu (Mobile Only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background py-4 px-6 animate-slide-down">
          <nav className="flex flex-col gap-4 text-sm font-semibold pb-4">
            {renderMobileNavLinks()}
            
            {ctaActive && ctaText && (
              <Link
                href={ctaLink || '#'}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-center ${ctaClass}`}
              >
                <span>{ctaText}</span>
                <Zap className="size-3.5 fill-current" />
              </Link>
            )}
          </nav>

          <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
            {renderMobileAuthSection()}
          </div>
        </div>
      )}
    </div>
  );
}



