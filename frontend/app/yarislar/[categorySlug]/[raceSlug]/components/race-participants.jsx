'use client';

import React from 'react';
import { Users, Search, Shield } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const getCountryCode = (nationality) => {
  if (!nationality) return null;
  const n = nationality.trim().toLowerCase();
  if (n === 'tr' || n === 'tur' || n === 'türkiye' || n === 'turkey' || n === 'türkiye (tr)' || n === 'türk') {
    return 'tr';
  }
  if (n === 'gb' || n === 'gbr' || n === 'uk' || n === 'united kingdom' || n === 'england' || n === 'ingiltere' || n === 'ingiliz') {
    return 'gb';
  }
  if (n === 'de' || n === 'deu' || n === 'germany' || n === 'almanya' || n === 'alman') {
    return 'de';
  }
  if (n === 'ru' || n === 'rus' || n === 'russia' || n === 'rusya') {
    return 'ru';
  }
  if (n === 'ua' || n === 'ukr' || n === 'ukraine' || n === 'ukrayna') {
    return 'ua';
  }
  if (n === 'fr' || n === 'fra' || n === 'france' || n === 'fransa') {
    return 'fr';
  }
  if (n === 'it' || n === 'ita' || n === 'italy' || n === 'italya') {
    return 'it';
  }
  if (n === 'nl' || n === 'nld' || n === 'netherlands' || n === 'holanda') {
    return 'nl';
  }
  if (n === 'us' || n === 'usa' || n === 'united states' || n === 'amerika') {
    return 'us';
  }
  if (n === 'gr' || n === 'grc' || n === 'greece' || n === 'yunanistan') {
    return 'gr';
  }
  if (n === 'bg' || n === 'bgr' || n === 'bulgaria' || n === 'bulgaristan') {
    return 'bg';
  }
  if (n === 'ro' || n === 'rou' || n === 'romania' || n === 'romanya') {
    return 'ro';
  }
  if (n === 'az' || n === 'aze' || n === 'azerbaijan' || n === 'azerbaycan') {
    return 'az';
  }
  if (nationality.length === 2) {
    return nationality.toLowerCase();
  }
  return null;
};

export default function RaceParticipants({ race, category, locale = 'tr' }) {
  const [participants, setParticipants] = React.useState([]);
  const [participantsLoading, setParticipantsLoading] = React.useState(true);
  const [selectedGender, setSelectedGender] = React.useState('male');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    setParticipantsLoading(true);
    fetch(`/api/public/races/${race.id}/participants?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        setParticipants(json.data || []);
        setParticipantsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setParticipantsLoading(false);
      });
  }, [race.id]);

  const ageGroups = React.useMemo(() => {
    // 1. Check if category has custom age_groups setting
    const customAgeGroupsStr = category?.field_settings?.age_groups;
    if (customAgeGroupsStr && typeof customAgeGroupsStr === 'string' && customAgeGroupsStr.trim()) {
      try {
        const parts = customAgeGroupsStr.split(',').map(p => p.trim());
        const groups = [];
        parts.forEach(part => {
          if (part.endsWith('+')) {
            const min = parseInt(part.replace('+', ''), 10);
            if (!isNaN(min)) {
              groups.push({
                label: part,
                min: min,
                max: 999
              });
            }
          } else {
            const range = part.split('-').map(r => parseInt(r.trim(), 10));
            if (range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
              groups.push({
                label: part,
                min: range[0],
                max: range[1]
              });
            }
          }
        });
        if (groups.length > 0) {
          return groups;
        }
      } catch (e) {
        console.error('Error parsing custom age groups:', e);
      }
    }

    // 2. Fallback to dynamic age grouping based on min_age and max_age
    const minAge = race.min_age || 18;
    const maxAge = race.max_age || 75;
    const groups = [];
    if (minAge < 22) {
      groups.push({
        label: `${minAge} - 21`,
        min: minAge,
        max: 21,
      });
    }
    let currentMin = Math.max(22, minAge);
    while (currentMin < maxAge && currentMin < 70) {
      const currentMax = Math.min(currentMin + 5, maxAge);
      groups.push({
        label: `${currentMin} - ${currentMax}`,
        min: currentMin,
        max: currentMax,
      });
      currentMin += 6;
    }
    if (maxAge >= 70) {
      groups.push({
        label: '70+',
        min: 70,
        max: 999,
      });
    }
    return groups;
  }, [category?.field_settings?.age_groups, race.min_age, race.max_age]);

  const filteredParticipants = React.useMemo(() => {
    return participants.filter(p => {
      // 1. Search Query filter (name or bib number)
      const matchesSearch = searchQuery
        ? (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (p.bib_number && String(p.bib_number).includes(searchQuery)))
        : true;

      // 2. Gender filter
      const matchesGender = selectedGender === 'all' 
        ? true 
        : p.gender === selectedGender;

      return matchesSearch && matchesGender;
    });
  }, [participants, searchQuery, selectedGender]);

  const groupedParticipants = React.useMemo(() => {
    const grouped = {};
    
    // Initialize each group with empty array
    ageGroups.forEach(group => {
      grouped[group.label] = [];
    });
    // For other/unsorted/null ages
    grouped['Diğer'] = [];

    filteredParticipants.forEach(p => {
      if (p.age === null || p.age === undefined) {
        grouped['Diğer'].push(p);
        return;
      }
      
      let placed = false;
      for (const group of ageGroups) {
        if (p.age >= group.min && p.age <= group.max) {
          grouped[group.label].push(p);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        grouped['Diğer'].push(p);
      }
    });

    return grouped;
  }, [ageGroups, filteredParticipants]);

  const accordionItems = React.useMemo(() => {
    const items = [];
    
    ageGroups.forEach(group => {
      const list = groupedParticipants[group.label] || [];
      if (list.length === 0) return;
      items.push({
        label: `${group.label} Yaş Aralığı`,
        count: list.length,
        participants: list,
        id: `group-${group.label}`
      });
    });

    const otherList = groupedParticipants['Diğer'] || [];
    if (otherList.length > 0) {
      items.push({
        label: locale === 'tr' ? 'Diğer / Yaş Belirtilmemiş' : 'Other / Age Unspecified',
        count: otherList.length,
        participants: otherList,
        id: 'group-other'
      });
    }

    return items;
  }, [ageGroups, groupedParticipants, locale, searchQuery]);

  return (
    <div className="space-y-6 py-4">
      {/* Sticky Header Wrapper */}
      <div className="sticky top-[80px] md:top-[135px] z-20 bg-background pt-2 pb-5 space-y-6 border-b border-border/40">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                {locale === 'tr' ? 'Katılımcı Listesi' : 'Participant List'}
              </h3>
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              {locale === 'tr' 
                ? `Toplam ${participants.length} kayıtlı sporcu listeleniyor.` 
                : `Listing a total of ${participants.length} registered athletes.`}
            </p>
          </div>

          {/* Gender Toggle Buttons */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-border/20 shrink-0">
            <button
              onClick={() => setSelectedGender('male')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                selectedGender === 'male'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {locale === 'tr' ? 'Erkekler' : 'Men'}
            </button>
            <button
              onClick={() => setSelectedGender('female')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                selectedGender === 'female'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {locale === 'tr' ? 'Kadınlar' : 'Women'}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder={locale === 'tr' ? 'Sporcu adı veya göğüs numarası ile ara...' : 'Search by athlete name or bib number...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-900/10 border-border/80 rounded-xl font-medium focus-visible:ring-primary/20 focus-visible:border-primary text-sm shadow-xs"
          />
        </div>
      </div>

      {participantsLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-zinc-50/20 dark:bg-zinc-900/5">
          <Users className="size-10 text-zinc-400 mx-auto opacity-40 mb-3" />
          <p className="text-sm font-bold text-zinc-500">
            {locale === 'tr' ? 'Kayıtlı katılımcı bulunmamaktadır.' : 'No registered participants.'}
          </p>
        </div>
      ) : filteredParticipants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-semibold text-zinc-500">
            {locale === 'tr' ? 'Arama sonucunuza uygun katılımcı bulunamadı.' : 'No matching participants found.'}
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {accordionItems.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border border-border/50 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-4 px-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-foreground group">
                <div className="flex items-center gap-3">
                  <span>{item.label}</span>
                  <Badge variant="outline" size="sm" className="font-extrabold text-[10px] py-0 px-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-border/40">
                    {item.count} {locale === 'tr' ? 'Sporcu' : 'Athletes'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-background border-t border-border/40">
                {item.count === 0 ? (
                  <p className="text-xs font-semibold text-zinc-400 py-2.5 pl-1.5">
                    {locale === 'tr' ? 'Bu yaş kategorisinde henüz kayıtlı sporcu bulunmamaktadır.' : 'No registered athletes in this age category.'}
                  </p>
                ) : (
                  <div>
                    {/* Desktop/Tablet View - Full Table */}
                    <div className="hidden sm:block overflow-x-auto w-full no-scrollbar">
                      <Table className="border-none bg-transparent sm:min-w-full">
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/20">
                          <TableRow>
                            <TableHead className="w-12 text-center font-black text-[10px] text-zinc-400 uppercase tracking-wider">{locale === 'tr' ? 'SIRA' : 'NO'}</TableHead>
                            <TableHead className="w-20 text-center font-black text-[10px] text-zinc-400 uppercase tracking-wider">{locale === 'tr' ? 'GÖĞÜS NO' : 'BIB NO'}</TableHead>
                            <TableHead className="font-black text-[10px] text-zinc-400 uppercase tracking-wider pl-4">{locale === 'tr' ? 'AD SOYAD' : 'NAME'}</TableHead>
                            <TableHead className="font-black text-[10px] text-zinc-400 uppercase tracking-wider hidden sm:table-cell">{locale === 'tr' ? 'CİNSİYET' : 'GENDER'}</TableHead>
                            <TableHead className="font-black text-[10px] text-zinc-400 uppercase tracking-wider">{locale === 'tr' ? 'KULÜP ADI' : 'CLUB NAME'}</TableHead>
                            <TableHead className="font-black text-[10px] text-zinc-400 uppercase tracking-wider hidden md:table-cell">{locale === 'tr' ? 'YARIŞ KATEGORİSİ' : 'RACE CATEGORY'}</TableHead>
                            <TableHead className="w-20 text-center font-black text-[10px] text-zinc-400 uppercase tracking-wider">{locale === 'tr' ? 'UYRUK' : 'NATIONALITY'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.participants.map((p, idx) => (
                            <TableRow key={idx} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                              <TableCell className="text-center font-bold text-xs text-zinc-500">{idx + 1}</TableCell>
                              <TableCell className="text-center font-black text-xs text-primary">
                                {p.bib_number ? `#${p.bib_number}` : '-'}
                              </TableCell>
                              <TableCell className="font-semibold text-sm text-foreground pl-4 capitalize whitespace-nowrap">
                                {p.name?.toLowerCase()}
                              </TableCell>
                              <TableCell className="font-semibold text-xs text-foreground hidden sm:table-cell">
                                {p.gender === 'male' ? (locale === 'tr' ? 'Erkek' : 'Men') : (locale === 'tr' ? 'Kadın' : 'Women')}
                              </TableCell>
                              <TableCell className="font-semibold text-xs text-zinc-500 max-w-[150px] truncate">
                                {p.club_name ? (
                                  <div className="flex items-center gap-1.5 capitalize">
                                    <Shield className="size-3.5 text-blue-500 shrink-0" strokeWidth={2} />
                                    <span className="truncate">{p.club_name.toLocaleLowerCase('tr-TR')}</span>
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="font-semibold text-xs text-zinc-500 hidden md:table-cell whitespace-nowrap">
                                {p.race_title || '-'}
                              </TableCell>
                              <TableCell className="text-center font-extrabold text-xs text-zinc-600 dark:text-zinc-400 uppercase whitespace-nowrap">
                                {p.nationality ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    {(() => {
                                      const code = getCountryCode(p.nationality);
                                      return code ? (
                                        <img
                                          src={`https://flagcdn.com/w20/${code}.png`}
                                          width="16"
                                          className="rounded-xs shadow-3xs shrink-0 border border-zinc-200/40"
                                          alt=""
                                        />
                                      ) : null;
                                    })()}
                                    <span>{p.nationality}</span>
                                  </div>
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile View - Sleek Card List (Zero Horizontal Scroll) */}
                    <div className="block sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/40 border-t border-border/40">
                      {item.participants.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 py-3 px-1.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          {/* Left: Name, Club, Race Category */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            
                            {/* Athlete Info */}
                            <div className="min-w-0">
                              <div className="font-bold text-foreground text-sm truncate capitalize">
                                {p.name?.toLowerCase()}
                              </div>
                              {(p.club_name || p.race_title) && (
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xxs text-zinc-500">
                                  {p.club_name && (
                                    <div className="flex items-center gap-1 min-w-0">
                                      <Shield className="size-3 text-blue-500 shrink-0" strokeWidth={2} />
                                      <span className="capitalize">{p.club_name.toLocaleLowerCase('tr-TR')}</span>
                                    </div>
                                  )}
                                  {p.club_name && p.race_title && <span className="text-zinc-300">•</span>}
                                  {p.race_title && (
                                    <span>{p.race_title}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Bib number tag & nationality flag */}
                          <div className="flex items-center gap-2.5 shrink-0 text-right">
                            <div className="space-y-0.5">
                              <div className="font-mono font-black text-xxs text-primary bg-primary/5 px-2 py-0.5 rounded-sm">
                                {p.bib_number ? `#${p.bib_number}` : '-'}
                              </div>
                              {p.nationality && (
                                <div className="flex items-center justify-end gap-1">
                                  {(() => {
                                    const code = getCountryCode(p.nationality);
                                    return code ? (
                                      <img
                                        src={`https://flagcdn.com/w20/${code}.png`}
                                        width="14"
                                        className="rounded-xs shrink-0 border border-zinc-200/40"
                                        alt=""
                                      />
                                    ) : null;
                                  })()}
                                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                                    {p.nationality}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
