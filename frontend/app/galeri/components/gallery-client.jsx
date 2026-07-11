'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Container } from '@/components/common/container';
import { Search, Image as ImageIcon, X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react';

function getLocalized(val, locale = 'tr') {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}

export default function GalleryClient({ categories, locale = 'tr' }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRaceId, setSelectedRaceId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lightbox State
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // 1. Process all photos from categories and races
  const allPhotos = useMemo(() => {
    const list = [];
    categories.forEach(category => {
      const categoryName = getLocalized(category.name, locale);
      const races = category.races || [];
      
      races.forEach(race => {
        const raceTitle = getLocalized(race.title, locale);
        const gallery = race.gallery || [];
        
        gallery.forEach(photo => {
          list.push({
            id: photo.id,
            url: photo.url,
            webpUrl: photo.webp_url,
            name: photo.name || photo.file_name || 'Yarış Görseli',
            categoryName,
            categoryId: category.id,
            categorySlug: getLocalized(category.slug, locale),
            raceTitle,
            raceId: race.id,
            date: race.start_date
          });
        });
      });
    });
    return list;
  }, [categories, locale]);

  // 2. Filter categories to only those containing races with galleries
  const activeCategories = useMemo(() => {
    return categories.filter(category => {
      const races = category.races || [];
      return races.some(race => race.gallery && race.gallery.length > 0);
    });
  }, [categories]);

  // 3. Filter races belonging to the selected category that have galleries
  const filteredRacesList = useMemo(() => {
    if (selectedCategory === 'all') {
      const list = [];
      categories.forEach(cat => {
        (cat.races || []).forEach(r => {
          if (r.gallery && r.gallery.length > 0 && !list.some(item => item.id === r.id)) {
            list.push(r);
          }
        });
      });
      return list;
    }
    const cat = categories.find(c => String(c.id) === String(selectedCategory));
    return cat ? (cat.races || []).filter(r => r.gallery && r.gallery.length > 0) : [];
  }, [categories, selectedCategory]);

  // Reset selected race when category changes
  useEffect(() => {
    setSelectedRaceId('all');
  }, [selectedCategory]);

  // 4. Compute final filtered photos list
  const filteredPhotos = useMemo(() => {
    return allPhotos.filter(photo => {
      // Category Filter
      if (selectedCategory !== 'all' && String(photo.categoryId) !== String(selectedCategory)) {
        return false;
      }
      // Race Filter
      if (selectedRaceId !== 'all' && String(photo.raceId) !== String(selectedRaceId)) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = photo.raceTitle.toLowerCase().includes(query);
        const matchesName = photo.name.toLowerCase().includes(query);
        const matchesCat = photo.categoryName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesName && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [allPhotos, selectedCategory, selectedRaceId, searchQuery]);

  // Lightbox Navigation helpers
  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(prev => (prev === 0 ? filteredPhotos.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex(prev => (prev === filteredPhotos.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'Escape') setActivePhotoIndex(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, filteredPhotos]);

  const activePhoto = activePhotoIndex !== null ? filteredPhotos[activePhotoIndex] : null;

  return (
    <Container className="py-10 space-y-8">
      {/* Search & Filter Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card border border-border p-5 rounded-2xl shadow-xs">
        
        {/* Category Tabs list */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl border transition-all duration-200 whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {locale === 'tr' ? `TÜMÜ (${allPhotos.length})` : `ALL (${allPhotos.length})`}
          </button>
          {activeCategories.map(cat => {
            const count = (cat.races || []).reduce((acc, r) => acc + (r.gallery?.length || 0), 0);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl border transition-all duration-200 whitespace-nowrap ${
                  String(selectedCategory) === String(cat.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {getLocalized(cat.name, locale)} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="relative min-w-[240px] md:max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder={locale === 'tr' ? 'Yarış veya kategori ara...' : 'Search races or categories...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-zinc-400 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Second Level: Race Dropdown Selector */}
      {filteredRacesList.length > 0 && (
        <div className="flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-xl border border-border/40 w-fit">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
            {locale === 'tr' ? 'Yarış Seçin:' : 'Select Race:'}
          </span>
          <select
            value={selectedRaceId}
            onChange={(e) => setSelectedRaceId(e.target.value)}
            className="bg-transparent border-0 font-bold text-sm text-foreground focus:ring-0 focus:outline-none cursor-pointer"
          >
            <option value="all">{locale === 'tr' ? 'Tüm Yarışlar' : 'All Races'}</option>
            {filteredRacesList.map(race => (
              <option key={race.id} value={race.id}>{getLocalized(race.title, locale)}</option>
            ))}
          </select>
        </div>
      )}

      {/* Main Grid View */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setActivePhotoIndex(index)}
              className="group cursor-pointer relative aspect-4/3 rounded-2xl overflow-hidden border border-border bg-zinc-100 dark:bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Photo Image */}
              <img
                src={photo.webpUrl || photo.url}
                alt={photo.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Hover Dark Overlay and Details */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary mb-1">
                  {photo.categoryName}
                </span>
                <h4 className="text-sm font-extrabold text-white line-clamp-1 leading-snug">
                  {photo.raceTitle}
                </h4>
                <p className="text-[10px] text-zinc-300 font-medium mt-0.5">
                  {photo.name}
                </p>
                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md size-8 rounded-full flex items-center justify-center text-white border border-white/10 transform scale-75 group-hover:scale-100 transition-transform duration-350">
                  <Maximize2 className="size-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl space-y-3">
          <ImageIcon className="size-10 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200">
            {locale === 'tr' ? 'Görsel Bulunamadı' : 'No Images Found'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            {locale === 'tr' 
              ? 'Seçilen filtrelere veya arama sorgusuna uygun fotoğraf bulunmamaktadır.'
              : 'There are no photos matching the selected filters or search query.'}
          </p>
        </div>
      )}

      {/* Lightbox Modal Overlay */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200"
          onClick={() => setActivePhotoIndex(null)}
        >
          {/* Top Panel Actions */}
          <div className="flex justify-between items-center w-full max-w-7xl mx-auto z-10">
            <div className="text-zinc-400 text-xs font-semibold">
              {activePhotoIndex + 1} / {filteredPhotos.length}
            </div>
            
            <div className="flex items-center gap-2">
              <a
                href={activePhoto.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title={locale === 'tr' ? 'Görseli İndir' : 'Download Image'}
              >
                <Download className="size-4.5" />
              </a>
              <button
                onClick={() => setActivePhotoIndex(null)}
                className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="size-4.5" />
              </button>
            </div>
          </div>

          {/* Central Image Slider Panel */}
          <div className="flex-grow flex items-center justify-center relative w-full max-w-5xl mx-auto py-4">
            
            {/* Prev Trigger */}
            <button
              onClick={handlePrev}
              className="absolute left-2 md:-left-16 p-3 rounded-full bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all z-10"
            >
              <ChevronLeft className="size-6" />
            </button>

            {/* Photo View Box */}
            <div 
              className="relative max-h-[70vh] sm:max-h-[75vh] max-w-full flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activePhoto.url}
                alt={activePhoto.name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-250 select-none"
              />
            </div>

            {/* Next Trigger */}
            <button
              onClick={handleNext}
              className="absolute right-2 md:-right-16 p-3 rounded-full bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all z-10"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          {/* Bottom Panel Details */}
          <div className="text-center w-full max-w-3xl mx-auto space-y-1 pb-4 z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              {activePhoto.categoryName}
            </span>
            <h3 className="text-base font-extrabold text-white">
              {activePhoto.raceTitle}
            </h3>
            <p className="text-xs text-zinc-400 font-medium">
              {activePhoto.name}
            </p>
          </div>
        </div>
      )}
    </Container>
  );
}
