'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, Search, X, BookOpen, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostCard } from '@/components/ui/post-card';
import { CtaSection } from '@/components/common/cta-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Helper to get localized values
function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

export default function PostListSection({
  initialEntries = [],
  contentTypeSlug = 'posts',
  locale = 'tr',
  settings = {},
  meta = {},
  currentPage = 1,
  totalPages = 1,
  hasPages = false
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  // Dynamically extract unique categories present in the entries
  const categories = React.useMemo(() => {
    const catsMap = new Map();
    initialEntries.forEach(entry => {
      const data = entry.data || {};
      const itemCats = entry.categories || data.categories || [];
      itemCats.forEach(c => {
        const id = c.id;
        const name = getLocalized(c.name || c.title || '', locale);
        if (id && name) {
          catsMap.set(id, { id, name });
        }
      });
    });
    return Array.from(catsMap.values());
  }, [initialEntries, locale]);

  // Client-side filtering logic
  const filteredEntries = React.useMemo(() => {
    return initialEntries.filter(entry => {
      const data = entry.data || {};
      const title = getLocalized(data.title || entry.title || '', locale).toLowerCase();
      const summary = getLocalized(data.summary || data.description || '', locale).toLowerCase();
      const content = typeof data.content === 'string' ? data.content.toLowerCase() : '';
      
      const matchesSearch = !searchQuery || 
        title.includes(searchQuery.toLowerCase()) || 
        summary.includes(searchQuery.toLowerCase()) ||
        content.includes(searchQuery.toLowerCase());
      
      const itemCats = entry.categories || data.categories || [];
      const matchesCategory = selectedCategory === 'all' || 
        itemCats.some(c => String(c.id) === String(selectedCategory));
      
      return matchesSearch && matchesCategory;
    });
  }, [initialEntries, searchQuery, selectedCategory, locale]);

  // Handle Featured Post Resolution (Only on page 1 and when no query or category filter is active)
  const isDefaultView = currentPage === 1 && searchQuery === '' && selectedCategory === 'all';
  const showFeatured = isDefaultView && filteredEntries.length > 0;
  
  const featuredPost = showFeatured ? filteredEntries[0] : null;
  const displayEntries = showFeatured ? filteredEntries.slice(1) : filteredEntries;

  // Resolve cover image for featured post
  const getCoverUrl = (item) => {
    if (!item) return '/media/previews/placeholder.png';
    const data = item.data || {};
    let coverUrl = '/media/previews/placeholder.png';
    
    if (data.cover_image && typeof data.cover_image === 'object') {
      coverUrl = data.cover_image.url || coverUrl;
    } else if (item.cover_image && typeof item.cover_image === 'object') {
      coverUrl = item.cover_image.url || coverUrl;
    } else {
      const mediaFields = [];
      Object.entries(data).forEach(([k, v]) => {
        if (v && typeof v === 'object' && v.url) {
          mediaFields.push(v);
        } else if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object' && v[0].url) {
          mediaFields.push(...v);
        }
      });
      const foundImage = mediaFields.find(m => m.mime_type?.startsWith('image/'));
      if (foundImage) {
        coverUrl = foundImage.url;
      }
    }

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const fullCoverUrl = coverUrl.startsWith('http') || coverUrl.startsWith('/') ? coverUrl : `${backendUrl}${coverUrl}`;
    const resolvedCoverUrl = fullCoverUrl.startsWith('/') && !fullCoverUrl.startsWith('//') ? `${backendUrl}${fullCoverUrl}` : fullCoverUrl;
    return resolvedCoverUrl;
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-12">
      {/* Title & Filter Row */}
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            {getLocalized(settings['site.name'], locale) || 'Core CMS'} Paylaşımları
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            En güncel içerikler, duyurular ve bilgilendirici makaleler burada listelenmektedir.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full max-w-sm shrink-0">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Yazılarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-border bg-card py-2.5 pr-10 pl-11 text-sm text-foreground shadow-xs outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Tabs Bar */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 border",
              selectedCategory === 'all'
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted/30"
            )}
          >
            TÜMÜ
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 border",
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted/30"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* --- FEATURED HERO BLOCK --- */}
      {showFeatured && featuredPost && (() => {
        const data = featuredPost.data || {};
        const title = getLocalized(data.title || featuredPost.title || '', locale) || 'Başlıksız';
        const summary = getLocalized(data.summary || data.description || '', locale);
        const author = data.author || 'Administrator';
        const readingTime = data.reading_time || featuredPost.reading_time || '5';
        const publishDate = featuredPost.published_at 
          ? new Date(featuredPost.published_at).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : null;
        
        const featuredCats = featuredPost.categories || data.categories || [];
        const detailUrl = `/${contentTypeSlug}/${getLocalized(data.slug || featuredPost.slug || '', locale)}`;
        const coverUrl = getCoverUrl(featuredPost);

        return (
          <div className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/10 shadow-xs transition-all duration-300 hover:shadow-md hover:border-primary/10">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Image Section */}
              <div className="relative aspect-video w-full overflow-hidden bg-muted/20 lg:col-span-7 lg:aspect-auto lg:h-[420px]">
                <img
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-102"
                  onError={(e) => {
                    e.target.src = '/media/previews/placeholder.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Content Info Section */}
              <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-between lg:col-span-5 h-full min-h-[350px] lg:h-[420px]">
                <div className="space-y-4">
                  {/* Category & Stats Header */}
                  <div className="flex flex-wrap items-center gap-3">
                    {featuredCats.slice(0, 1).map((cat, idx) => (
                      <Badge
                        key={cat.id || idx}
                        className="bg-primary/10 text-primary hover:bg-primary/10 border-0 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                      >
                        Öne Çıkan: {getLocalized(cat.name || cat.title || '', locale)}
                      </Badge>
                    ))}
                    <span className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider">
                      {readingTime} Dk Okuma
                    </span>
                  </div>

                  {/* Title */}
                  <Link href={detailUrl} className="block group/title">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground leading-snug group-hover/title:text-primary transition-colors line-clamp-3">
                      {title}
                    </h2>
                  </Link>

                  {/* Excerpt Summary */}
                  {summary && (
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-3">
                      {summary}
                    </p>
                  )}
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between border-t border-border/50 pt-5 mt-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-foreground uppercase tracking-wider">
                      Yazar: {author}
                    </span>
                    {publishDate && (
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {publishDate}
                      </span>
                    )}
                  </div>
                  <Button asChild size="sm" className="rounded-xl font-bold gap-1.5 shrink-0 group-hover:bg-primary/90">
                    <Link href={detailUrl}>
                      Devamını Oku <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- GRID OF OTHER ENTRIES --- */}
      {filteredEntries.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-3xl bg-muted/5 flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Inbox className="size-8" />
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-lg font-bold">Yazı bulunamadı.</p>
            <p className="text-muted-foreground/70 text-sm max-w-xs mx-auto">
              Arama kriterlerinize veya seçilen kategoriye uygun herhangi bir içerik bulunmamaktadır.
            </p>
          </div>
          {(searchQuery || selectedCategory !== 'all') && (
            <Button onClick={handleClearFilters} variant="outline" className="rounded-xl font-bold mt-2">
              Filtreleri Temizle
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {showFeatured && (
            <h3 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="size-5 text-primary" /> Son Paylaşılanlar
            </h3>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayEntries.map((entry) => (
              <div key={entry.id} className="animate-fade-in h-full">
                <PostCard item={entry} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search/Filter Notice for Server Pagination */}
      {hasPages && (searchQuery || selectedCategory !== 'all') && (
        <p className="text-xs text-muted-foreground/60 text-center pt-2 italic">
          * Arama ve kategori filtreleri geçerli sayfadaki {initialEntries.length} içerik arasında yapılmıştır. Diğer sayfalar için paginasyon düğmelerini kullanabilirsiniz.
        </p>
      )}

      {/* Server Pagination controls */}
      {hasPages && !searchQuery && selectedCategory === 'all' && (
        <div className="flex justify-center items-center gap-4 pt-8 border-t border-border">
          <Link
            href={`/${contentTypeSlug}?page=${currentPage - 1}`}
            className={cn(
              "px-4 py-2 border border-border rounded-xl text-sm font-semibold transition-colors bg-card hover:bg-muted/50",
              currentPage <= 1 ? 'pointer-events-none opacity-40 bg-muted/20' : ''
            )}
          >
            ← Önceki
          </Link>
          <span className="text-sm font-bold text-muted-foreground">
            Sayfa {currentPage} / {totalPages}
          </span>
          <Link
            href={`/${contentTypeSlug}?page=${currentPage + 1}`}
            className={cn(
              "px-4 py-2 border border-border rounded-xl text-sm font-semibold transition-colors bg-card hover:bg-muted/50",
              currentPage >= totalPages ? 'pointer-events-none opacity-40 bg-muted/20' : ''
            )}
          >
            Sonraki →
          </Link>
        </div>
      )}

      {/* Bülten / CTA Section */}
      <div className="pt-12 border-t border-border/80">
        <CtaSection 
          fullWidth={true} 
          variant="primary" 
          title="Yazılarımızı Kaçırmayın!" 
          description="Haftalık bültenimize katılarak en popüler gönderilerden ve güncellemelerden anında haberdar olun."
          primaryBtnText="Bültene Katıl"
          primaryBtnLink="#"
          secondaryBtnText="Hakkımızda"
          secondaryBtnLink="/about-us"
        />
      </div>
    </div>
  );
}
