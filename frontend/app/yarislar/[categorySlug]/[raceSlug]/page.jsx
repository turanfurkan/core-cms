import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicSettings, getPublicNavigation, backendFetch } from '@/lib/api-server';
import PublicHeader from '@/components/common/public-header';
import PublicFooter from '@/components/common/public-footer';
import PageHeader from '@/components/common/page-header';
import { Container } from '@/components/common/container';
import RaceDetailsTabs from './components/race-details-tabs';
import RaceParticipants from './components/race-participants';
import SimilarRacesCarousel from './components/similar-races-carousel';
import StravaEmbed from './components/strava-embed';
import SponsorsBlock from '@/components/blocks/sponsors-block';
import { ShareButtons, BackToTopButton } from './components/client-widgets';
import { 
  Calendar, 
  Clock, 
  Trophy, 
  MapPin, 
  Sparkles, 
  User, 
  UserPlus, 
  Info, 
  Phone, 
  ArrowLeft, 
  ArrowUpRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

async function getCategoryBySlug(slug) {
  try {
    const res = await backendFetch(`/api/categories?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0] || null;
  } catch (e) {
    console.error('Error loading category:', e);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { categorySlug, raceSlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  const races = category?.races || [];
  const race = races.find(r => {
    const slugTr = r.slug?.tr || r.slug;
    const slugEn = r.slug?.en || r.slug;
    return slugTr === raceSlug || slugEn === raceSlug;
  });

  if (!race) {
    return { title: 'Yarış Detayı | Core CMS' };
  }

  const settings = await getPublicSettings();
  const rawSiteName = settings['site.name'];
  const siteName = typeof rawSiteName === 'object' ? (rawSiteName?.tr || 'Core CMS') : 'Core CMS';

  const raceTitle = getLocalized(race.title, 'tr');
  const catName = getLocalized(category.name, 'tr');

  return {
    title: `${raceTitle} - ${catName} | ${siteName}`,
    description: getLocalized(race.description, 'tr')?.replace(/<[^>]*>/g, '').substring(0, 160),
  };
}

export default async function RaceDetailPage({ params }) {
  const { categorySlug, raceSlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category || category.type !== 'race') {
    notFound();
  }

  const races = category.races || [];
  const race = races.find(r => {
    const slugTr = r.slug?.tr || r.slug;
    const slugEn = r.slug?.en || r.slug;
    return slugTr === raceSlug || slugEn === raceSlug;
  });

  if (!race) {
    notFound();
  }

  const settings = await getPublicSettings();
  
  let frontSettings = settings['frontend.system_settings'] || {};
  if (typeof frontSettings === 'string') {
    try {
      frontSettings = JSON.parse(frontSettings);
    } catch (e) {
      frontSettings = {};
    }
  }

  const headerMenuKey = frontSettings.headerMenu || 'header';
  const footerMenuKey = frontSettings.footerMenu || '';
  
  let headerMenuItems = null;
  let footerMenuItems = null;

  if (headerMenuKey && headerMenuKey !== 'none_static') {
    const nav = await getPublicNavigation(headerMenuKey);
    headerMenuItems = nav?.items || null;
  }

  if (footerMenuKey && footerMenuKey !== 'none_static') {
    const nav = await getPublicNavigation(footerMenuKey);
    footerMenuItems = nav?.items || null;
  }

  const categoryName = getLocalized(category.name, 'tr');
  const raceTitle = getLocalized(race.title, 'tr');

  // Resolve cover image url
  let imgUrl = 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80'; // fallback
  if (race.cover_image && typeof race.cover_image === 'object') {
    imgUrl = race.cover_image.url || imgUrl;
  }
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
  const resolvedImgUrl = imgUrl.startsWith('http') || imgUrl.startsWith('/') 
    ? (imgUrl.startsWith('/') && !imgUrl.startsWith('//') ? `${backendUrl}${imgUrl}` : imgUrl) 
    : `${backendUrl}/${imgUrl}`;

  // Resolve graphic image url
  let graphicImgUrl = null;
  if (race.graphic_image && typeof race.graphic_image === 'object') {
    graphicImgUrl = race.graphic_image.url || null;
  } else if (typeof race.graphic_image === 'string') {
    graphicImgUrl = race.graphic_image;
  }
  const resolvedGraphicImgUrl = graphicImgUrl
    ? (graphicImgUrl.startsWith('http') || graphicImgUrl.startsWith('/') 
      ? (graphicImgUrl.startsWith('/') && !graphicImgUrl.startsWith('//') ? `${backendUrl}${graphicImgUrl}` : graphicImgUrl) 
      : `${backendUrl}/${graphicImgUrl}`)
    : null;

  // Format date display
  let formattedDate = '';
  if (race.start_date) {
    const dateObj = new Date(race.start_date);
    formattedDate = dateObj.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  }

  // Format registration deadline
  let formattedDeadline = '';
  if (race.registration_deadline) {
    const dateObj = new Date(race.registration_deadline);
    formattedDeadline = dateObj.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Pricing calculations
  const price = race.price ? parseFloat(race.price) : 0;
  const discountedPrice = race.discounted_price ? parseFloat(race.discounted_price) : 0;
  const hasDiscount = discountedPrice > 0 && discountedPrice < price;
  const activePrice = hasDiscount ? discountedPrice : price;
  const isFree = race.is_free || price === 0;
  const discountPercent = price > 0 ? Math.round(((price - discountedPrice) / price) * 100) : 0;

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <PublicHeader settings={settings} menuItems={headerMenuItems} />
        
        <main className="pb-24 lg:pb-16 space-y-8">
          {/* Breadcrumb Header */}
          <PageHeader 
            title={raceTitle}
            breadcrumbs={[
              { label: 'Yarışlar', href: '/yarislar' },
              { label: categoryName, href: `/yarislar/${categorySlug}` },
              { label: raceTitle }
            ]}
          />

          <Container className="grid gap-8 lg:grid-cols-3">
            {/* Left/Main Column: Hero Banner & Tabs */}
            <div className="lg:col-span-2 space-y-12 min-w-0">
              {/* Large Race Card Cover Image / Strava Map / Graphic Image layout */}
              {(() => {
                const hasStrava = !!race.location_embed;
                const hasGraphic = !!resolvedGraphicImgUrl;

                if (hasStrava && hasGraphic) {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strava Embed Map container */}
                      <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/10 h-[300px] sm:h-[380px] [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:border-0 shadow-xs w-full max-w-full strava-embed-container">
                        <StravaEmbed html={race.location_embed} />
                      </div>
                      {/* Graphic Image container */}
                      <div className="relative rounded-2xl overflow-hidden border border-border bg-zinc-950 dark:bg-zinc-950/40 flex items-center justify-center h-[300px] sm:h-[380px] w-full max-w-full">
                        <div 
                          className="absolute inset-0 bg-cover bg-center filter blur-md opacity-20"
                          style={{ backgroundImage: `url(${resolvedGraphicImgUrl})` }}
                        />
                        <img 
                          src={resolvedGraphicImgUrl} 
                          alt="Parkur Grafiği"
                          className="relative z-10 max-w-full max-h-full object-contain p-4"
                        />
                        
                        {/* Floating Distance Badge */}
                        {race.distance && (
                          <span className="absolute top-4 right-4 z-20 text-xs font-black bg-primary text-white px-3.5 py-2 rounded-xl shadow-lg border border-orange-600/30 flex items-center gap-1.5 animate-pulse">
                            <Trophy className="size-4 text-white" />
                            <span>{parseFloat(race.distance)} KM</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                if (hasStrava) {
                  return (
                    <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/10 h-[300px] sm:h-[380px] [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:border-0 shadow-xs w-full max-w-full strava-embed-container">
                      <StravaEmbed html={race.location_embed} />
                    </div>
                  );
                }

                if (hasGraphic) {
                  return (
                    <div className="relative rounded-2xl overflow-hidden border border-border bg-zinc-950 dark:bg-zinc-950/40 flex items-center justify-center h-[300px] sm:h-[380px] w-full max-w-full">
                      <div 
                        className="absolute inset-0 bg-cover bg-center filter blur-md opacity-20"
                        style={{ backgroundImage: `url(${resolvedGraphicImgUrl})` }}
                      />
                      <img 
                        src={resolvedGraphicImgUrl} 
                        alt="Parkur Grafiği"
                        className="relative z-10 max-w-full max-h-full object-contain p-4"
                      />
                      
                      {/* Floating Distance Badge */}
                      {race.distance && (
                        <span className="absolute top-4 right-4 z-20 text-xs font-black bg-primary text-white px-3.5 py-2 rounded-xl shadow-lg border border-orange-600/30 flex items-center gap-1.5 animate-pulse">
                          <Trophy className="size-4 text-white" />
                          <span>{parseFloat(race.distance)} KM</span>
                        </span>
                      )}
                    </div>
                  );
                }

                // Fallback to Cover Image
                return (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-zinc-950 dark:bg-zinc-950/40 flex items-center justify-center h-[300px] sm:h-[380px] w-full max-w-full">
                    <div 
                      className="absolute inset-0 bg-cover bg-center filter blur-md opacity-20"
                      style={{ backgroundImage: `url(${resolvedImgUrl})` }}
                    />
                    <img 
                      src={resolvedImgUrl} 
                      alt={raceTitle}
                      className="relative z-10 max-w-full max-h-full object-contain"
                    />
                    
                    {/* Floating Distance Badge */}
                    {race.distance && (
                      <span className="absolute top-4 right-4 z-20 text-xs font-black bg-primary text-white px-3.5 py-2 rounded-xl shadow-lg border border-orange-600/30 flex items-center gap-1.5 animate-pulse">
                        <Trophy className="size-4 text-white" />
                        <span>{parseFloat(race.distance)} KM</span>
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Dynamic Tabs switcher */}
              <RaceDetailsTabs race={race} locale="tr" />

              {/* Divider line between Tabs and Participant list */}
              <div className="h-px bg-zinc-200/60 dark:bg-zinc-800/60" />

              {/* Race Participants List */}
              <RaceParticipants race={race} category={category} locale="tr" />
            </div>

            {/* Right Column: Sticky Sidebar Info & Registration CTA */}
            <div className="space-y-6 h-fit lg:sticky lg:top-36 z-20 min-w-0">
              
              {/* Registration Call To Action card */}
              <div className="p-6 border border-border bg-card rounded-2xl shadow-xs space-y-6 flex flex-col">
                {/* Highlighted Price Box - stretched to full width as card header */}
                <div className={`-mx-6 -mt-6 border-b border-border/60 px-6 py-5 space-y-1 transition-all duration-150 rounded-t-2xl ${race.is_sales_active !== false ? 'bg-zinc-50 dark:bg-zinc-900/40' : 'bg-red-50/10 dark:bg-red-950/5 border-b-red-100 dark:border-b-red-950/20'}`}>
                  <span className={`text-[11px] font-black uppercase tracking-wider block ${race.is_sales_active !== false ? 'text-zinc-400 dark:text-zinc-500' : 'text-red-500 dark:text-red-400'}`}>
                    {race.is_sales_active !== false ? 'YARIŞ KATILIM BEDELİ' : 'BAŞVURULAR SONA ERDİ'}
                  </span>
                    {isFree ? (
                      <span className={`text-3xl font-black block ${race.is_sales_active !== false ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-400 line-through'}`}>Ücretsiz</span>
                    ) : (
                      <div className="space-y-0.5">
                        {/* Active/Discounted Price Row */}
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className={`text-3xl sm:text-4xl font-black tracking-tight ${race.is_sales_active !== false ? 'text-[#03112b] dark:text-zinc-50' : 'text-zinc-400/80 line-through'}`}>
                            {activePrice.toLocaleString('tr-TR')}
                          </span>
                          <span className="text-xs font-extrabold text-zinc-400 uppercase mr-1">
                            {race.currency || 'TRY'}
                          </span>
                          {hasDiscount && race.is_sales_active !== false && (
                            <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm animate-pulse align-middle">
                              %{discountPercent} İNDİRİM
                            </span>
                          )}
                        </div>
                        {/* Original Price Row */}
                        {hasDiscount && race.is_sales_active !== false && (
                          <div className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                            <span className="line-through">
                              {price.toLocaleString('tr-TR')} {race.currency || 'TRY'}
                            </span>
                            <span className="text-[10px] text-zinc-400/70 font-normal">
                              (Normal Fiyat)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                {/* Key Race Stats */}
                <div className="space-y-4">
                  {formattedDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="size-5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-black uppercase text-zinc-400 tracking-wider">Tarih</span>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{formattedDate}</span>
                      </div>
                    </div>
                  )}

                  {race.start_time && (
                    <div className="flex items-start gap-3">
                      <Clock className="size-5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-black uppercase text-zinc-400 tracking-wider">Başlangıç Saati</span>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{race.start_time.slice(0, 5)}</span>
                      </div>
                    </div>
                  )}

                  {formattedDeadline && (
                    <div className="flex items-start gap-3">
                      <Calendar className="size-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-black uppercase text-red-400 tracking-wider">Son Kayıt Tarihi</span>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{formattedDeadline}</span>
                      </div>
                    </div>
                  )}

                  {race.max_participants && (
                    <div className="flex items-start gap-3">
                      <User className="size-5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-black uppercase text-zinc-400 tracking-wider">Katılımcı Limiti</span>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{race.max_participants} Sporcu</span>
                      </div>
                    </div>
                  )}

                  {(race.age_limit_min || race.age_limit_max) && (
                    <div className="flex items-start gap-3">
                      <Info className="size-5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-black uppercase text-zinc-400 tracking-wider">Yaş Sınırları</span>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          {race.age_limit_min ?? '18'} - {race.age_limit_max ?? '75'} Yaş Arası
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary CTA Buttons */}
                <div className="space-y-3 pt-4 border-t border-border/40">
                  {race.is_sales_active !== false ? (
                    <Button
                      asChild
                      variant="primary"
                      size="lg"
                      className="w-full text-sm font-extrabold rounded-xl py-6 shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 group"
                    >
                      <a
                        href={race.settings?.registration_link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <UserPlus className="size-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                        <span>Kayıt Ol</span>
                      </a>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      size="lg"
                      className="w-full text-sm font-extrabold rounded-xl py-6 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Clock className="size-4 shrink-0" />
                      <span>Kayıtlar Kapandı</span>
                    </Button>
                  )}

                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full text-xs font-bold rounded-xl py-6"
                  >
                    <Link href={`/yarislar/${categorySlug}`} className="flex items-center justify-center gap-2">
                      <ArrowLeft className="size-4 shrink-0" />
                      <span>{categoryName} Yarışlarına Dön</span>
                    </Link>
                  </Button>

                  <ShareButtons title={raceTitle} locale="tr" />
                </div>
              </div>

              {/* Event Manager Info Card */}
              {(race.manager_name || race.manager_phone) && (
                <div className="p-5 border border-border/60 bg-muted/10 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-primary shrink-0" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                      YARIŞ SORUMLUSU
                    </span>
                  </div>
                  <div className="space-y-1">
                    {race.manager_name && (
                      <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                        {race.manager_name}
                      </p>
                    )}
                    {race.manager_phone && (
                      <a 
                        href={`tel:${race.manager_phone}`} 
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 w-fit"
                      >
                        <span>{race.manager_phone}</span>
                        <ArrowUpRight className="size-3 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              )}

            </div>
          </Container>

          {/* Sponsors Section */}
          <div className="py-8 bg-zinc-50/30 dark:bg-zinc-900/5 [&>section]:!border-0">
            <SponsorsBlock 
              data={{
                content: {
                  source_type: 'dynamic',
                  section_title: { tr: '', en: '' },
                  section_subtitle: { tr: '', en: '' }
                },
                styles: {
                  layout: 'grid',
                  bg_color: 'transparent',
                  paddingTop: 16,
                  paddingBottom: 16
                }
              }}
              locale="tr"
            />
          </div>

          {/* Similar Races Section */}
          <Container className="py-12">
            <SimilarRacesCarousel 
              races={races}
              categorySlug={categorySlug}
              currentRaceId={race.id}
              locale="tr"
            />
          </Container>
        </main>
      </div>
      <PublicFooter settings={settings} menuItems={footerMenuItems} />
      <BackToTopButton locale="tr" />

      {/* Mobile Sticky Bottom CTA Bar */}
      {race.is_sales_active !== false && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-md border-t border-border pl-14 pr-6 py-3.5 flex items-center justify-between gap-4 shadow-xl select-none animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {isFree ? 'Yarış Bedeli' : 'Katılım Bedeli'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {isFree ? 'Ücretsiz' : `${activePrice.toLocaleString('tr-TR')} ${race.currency || 'TRY'}`}
              </span>
              {hasDiscount && (
                <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">
                  -%{discountPercent}
                </span>
              )}
            </div>
          </div>
          <Button 
            asChild 
            size="md" 
            className="bg-primary hover:bg-primary/95 text-white font-black text-xs rounded-xl px-5 py-2.5 shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-98"
          >
            <Link href={`/yarislar/${categorySlug}/${raceSlug}/kayit`}>
              <UserPlus className="size-3.5 shrink-0 text-white" />
              <span className="text-white">Kayıt Ol</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
