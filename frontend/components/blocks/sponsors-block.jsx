'use client';

import React, { useMemo } from 'react';

function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] ?? '';
  }
  return val ?? '';
}

export default function SponsorsBlock({ data, locale = 'tr' }) {
  const block = data || {};
  const content = block.content || block.data || {};
  const styles = block.styles || {};

  const title = getLocalized(content.section_title, locale);
  const subtitle = getLocalized(content.section_subtitle, locale);

  const layout = styles.layout || 'grid';
  const bgColor = styles.bg_color || '#ffffff';
  const textColor = styles.text_color || '#09090b';
  const accentColor = styles.accent_color || '#f97316';
  const speed = styles.speed || '30';
  const paddingTop = styles.paddingTop ? `${styles.paddingTop}px` : '64px';
  const paddingBottom = styles.paddingBottom ? `${styles.paddingBottom}px` : '64px';

  const sourceType = content.source_type || 'manual';
  const categorySlug = content.category_slug || '';

  const [dynamicPartners, setDynamicPartners] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (sourceType !== 'dynamic') return;

    let active = true;
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const queryParam = categorySlug ? `?category_slug=${categorySlug}` : '';
        const res = await fetch(`/api/public/partners${queryParam}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (active && json.data) {
            setDynamicPartners(json.data);
          }
        }
      } catch (e) {
        console.error('Failed to fetch dynamic partners:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPartners();
    return () => { active = false; };
  }, [sourceType, categorySlug]);

  const items = useMemo(() => {
    if (sourceType === 'dynamic') {
      return dynamicPartners;
    }
    return Array.isArray(content.items) ? content.items : [];
  }, [sourceType, content.items, dynamicPartners]);

  const categorizedGroups = useMemo(() => {
    const groups = {}; // id -> { name, order, items: [] }
    const uncategorized = [];

    items.forEach(item => {
      const cats = item.categories;
      if (Array.isArray(cats) && cats.length > 0) {
        cats.forEach(cat => {
          const catId = cat.id;
          const catName = getLocalized(cat.name, locale);
          if (!groups[catId]) {
            groups[catId] = {
              id: catId,
              name: catName,
              order: cat.order || 0,
              items: []
            };
          }
          if (!groups[catId].items.some(i => i.id === item.id)) {
            groups[catId].items.push(item);
          }
        });
      } else {
        uncategorized.push(item);
      }
    });

    const sortedGroups = Object.values(groups).sort((a, b) => a.order - b.order);
    return {
      groups: sortedGroups,
      uncategorized
    };
  }, [items, locale]);

  if (items.length === 0 && !loading) {
    return (
      <div className="w-full py-8 text-center text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-muted-foreground border border-dashed border-zinc-200 dark:border-zinc-800 select-none">
        {locale === 'tr' ? 'Gösterilecek sponsor bulunamadı. Lütfen ayarları kontrol edin.' : 'No sponsors found to display.'}
      </div>
    );
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
  const getAbsoluteLogo = (logoPath) => {
    if (!logoPath) return 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80';
    
    let path = logoPath;
    if (typeof logoPath === 'object' && logoPath !== null) {
      path = logoPath.url || logoPath.path || '';
    }
    
    if (!path || typeof path !== 'string') {
      return 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80';
    }

    if (path.startsWith('http') || path.startsWith('/')) {
      if (path.startsWith('/') && !path.startsWith('//')) {
        return `${backendUrl}${path}`;
      }
      return path;
    }
    return `${backendUrl}/${path}`;
  };

  const inlineStyles = {
    backgroundColor: bgColor,
    color: textColor,
    paddingTop,
    paddingBottom
  };

  const renderLogoGroup = (groupItems) => {
    if (layout === 'marquee') {
      let scrollItems = [...groupItems];
      if (scrollItems.length > 0) {
        while (scrollItems.length < 10) {
          scrollItems = [...scrollItems, ...groupItems];
        }
      }
      return (
        <div className="w-full relative overflow-hidden py-4">
          <div className="flex gap-8 w-max animate-marquee-scroller">
            {scrollItems.map((item, index) => {
              const logo = getAbsoluteLogo(item.logo);
              const contentNode = (
                <div className="w-40 sm:w-48 h-20 sm:h-24 bg-zinc-50 dark:bg-[#0b1428] border border-zinc-200/60 dark:border-white/5 rounded-2xl p-4 flex items-center justify-center transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700/60 group">
                  <img
                    src={logo}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain transition-all duration-300"
                  />
                </div>
              );

              if (item.link) {
                return (
                  <a key={index} href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                    {contentNode}
                  </a>
                );
              }

              return <div key={index}>{contentNode}</div>;
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {groupItems.map((item, index) => (
          <SponsorCard key={index} item={item} getAbsoluteLogo={getAbsoluteLogo} />
        ))}
      </div>
    );
  };

  // Group sponsors by gold vs silver vs general tier (for fallback / manual items)
  const goldSponsors = items.filter(item => item.tier === 'gold');
  const otherSponsors = items.filter(item => item.tier !== 'gold');

  return (
    <section 
      style={inlineStyles}
      className="relative w-full overflow-hidden select-none border-y border-zinc-150 dark:border-white/5 z-10"
    >
      {layout === 'marquee' && (
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-scroller {
            animation: marquee ${speed}s linear infinite;
          }
          .animate-marquee-scroller:hover {
            animation-play-state: paused;
          }
        `}} />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        {(title || subtitle) && (
          <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
            {title && (
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase" style={{ color: textColor }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                {subtitle}
              </p>
            )}
            <div className="w-16 h-1 mx-auto rounded-full" style={{ backgroundColor: accentColor }} />
          </div>
        )}

        {categorizedGroups.groups.length > 0 ? (
          <div className="space-y-16">
            {categorizedGroups.groups.map((group) => (
              <div key={group.id} className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: accentColor }}>
                    {group.name}
                  </span>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-grow" />
                </div>
                {renderLogoGroup(group.items)}
              </div>
            ))}

            {categorizedGroups.uncategorized.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {locale === 'tr' ? 'Diğer Sponsorlar' : 'Other Sponsors'}
                  </span>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-grow" />
                </div>
                {renderLogoGroup(categorizedGroups.uncategorized)}
              </div>
            )}
          </div>
        ) : (
          /* Legacy/Manual/Flat Layout */
          layout === 'marquee' ? (
            renderLogoGroup(items)
          ) : (
            <div className="space-y-12">
              {/* Tier 1: Gold / Main Sponsors */}
              {goldSponsors.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: accentColor }}>
                      {locale === 'tr' ? 'Ana Sponsorlar' : 'Gold Sponsors'}
                    </span>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-grow" />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {goldSponsors.map((item, index) => (
                      <SponsorCard key={index} item={item} getAbsoluteLogo={getAbsoluteLogo} />
                    ))}
                  </div>
                </div>
              )}

              {/* Tier 2: General/Silver Sponsors */}
              {otherSponsors.length > 0 && (
                <div className="space-y-6">
                  {goldSponsors.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        {locale === 'tr' ? 'Destekçi & Resmi Partnerler' : 'Official Partners'}
                      </span>
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-grow" />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {otherSponsors.map((item, index) => (
                      <SponsorCard key={index} item={item} getAbsoluteLogo={getAbsoluteLogo} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </section>
  );
}

function SponsorCard({ item, getAbsoluteLogo }) {
  const logo = getAbsoluteLogo(item.logo);
  const cardNode = (
    <div className="h-20 sm:h-24 bg-zinc-50 dark:bg-[#0b1428] border border-zinc-200/60 dark:border-white/5 rounded-2xl p-4 flex items-center justify-center transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700/60 hover:-translate-y-1 group relative">
      <img
        src={logo}
        alt={item.name}
        className="max-h-full max-w-full object-contain transition-all duration-300"
      />
    </div>
  );

  if (item.link) {
    return (
      <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
        {cardNode}
      </a>
    );
  }

  return cardNode;
}
