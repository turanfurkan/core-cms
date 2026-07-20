'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import {
  Stepper,
  StepperNav,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperTitle,
  StepperContent,
} from '@/components/ui/stepper';
import { Input, FloatingInput, InputWrapper } from '@/components/ui/input';
import { Select, FloatingSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trophy,
  CheckCircle2,
  Lock,
  Clock,
  User,
  Eye,
  UserPlus,
  ShieldCheck,
  CreditCard,
  ClipboardList,
  MapPin,
  Mail,
  Phone,
  TicketPercent,
  AlertTriangle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
const COUNTRIES = [
  { code: 'TR', name: 'Türkiye', callingCode: '+90', flag: '🇹🇷', mask: '(999) 999 99 99' },
  { code: 'AF', name: 'Afghanistan', callingCode: '+93', flag: '🇦🇫', mask: '99 999 9999' },
  { code: 'AU', name: 'Australia', callingCode: '+61', flag: '🇦🇺', mask: '9 9999 9999' },
  { code: 'AT', name: 'Austria', callingCode: '+43', flag: '🇦🇹', mask: '999 999 999' },
  { code: 'AZ', name: 'Azerbaijan', callingCode: '+994', flag: '🇦🇿', mask: '(99) 999 99 99' },
  { code: 'BY', name: 'Belarus', callingCode: '+375', flag: '🇧🇾', mask: '(99) 999-99-99' },
  { code: 'BR', name: 'Brazil', callingCode: '+55', flag: '🇧🇷', mask: '(99) 99999-9999' },
  { code: 'HR', name: 'Croatia (Hrvatska)', callingCode: '+385', flag: '🇭🇷', mask: '99 999 9999' },
  { code: 'EG', name: 'Egypt', callingCode: '+20', flag: '🇪🇬', mask: '99 9999 9999' },
  { code: 'FI', name: 'Finland', callingCode: '+358', flag: '🇫🇮', mask: '99 999 9999' },
  { code: 'FR', name: 'France', callingCode: '+33', flag: '🇫🇷', mask: '9 99 99 99 99' },
  { code: 'DE', name: 'Germany', callingCode: '+49', flag: '🇩🇪', mask: '999 9999 9999' },
  { code: 'GR', name: 'Greece', callingCode: '+30', flag: '🇬🇷', mask: '999 999 9999' },
  { code: 'IR', name: 'Iran (Islamic Republic of)', callingCode: '+98', flag: '🇮🇷', mask: '999 999 9999' },
  { code: 'IT', name: 'Italy', callingCode: '+39', flag: '🇮🇹', mask: '999 999 9999' },
  { code: 'JP', name: 'Japan', callingCode: '+81', flag: '🇯🇵', mask: '99 9999 9999' },
  { code: 'JO', name: 'Jordan', callingCode: '+962', flag: '🇯🇴', mask: '9 9999 9999' },
  { code: 'KZ', name: 'Kazakhstan', callingCode: '+7', flag: '🇰🇿', mask: '(999) 999-99-99' },
  { code: 'KP', name: "Korea, Democratic People's Republic of", callingCode: '+850', flag: '🇰🇵', mask: '99 999 9999' },
  { code: 'KR', name: 'Korea, Republic of', callingCode: '+82', flag: '🇰🇷', mask: '99-9999-9999' },
  { code: 'KG', name: 'Kyrgyzstan', callingCode: '+996', flag: '🇰🇬', mask: '(999) 999-999' },
  { code: 'NL', name: 'Netherlands', callingCode: '+31', flag: '🇳🇱', mask: '9 9999 9999' },
  { code: 'RU', name: 'Russian Federation', callingCode: '+7', flag: '🇷🇺', mask: '(999) 999-99-99' },
  { code: 'RW', name: 'Rwanda', callingCode: '+250', flag: '🇷🇼', mask: '999 999 999' },
  { code: 'ZA', name: 'South Africa', callingCode: '+27', flag: '🇿🇦', mask: '99 999 9999' },
  { code: 'UA', name: 'Ukraine', callingCode: '+380', flag: '🇺🇦', mask: '(99) 999 99 99' },
  { code: 'GB', name: 'United Kingdom', callingCode: '+44', flag: '🇬🇧', mask: '9999 999999' },
  { code: 'US', name: 'United States', callingCode: '+1', flag: '🇺🇸', mask: '(999) 999-9999' }
];

// Helper to resolve localized fields
function getLocalized(val, locale = 'tr') {
  if (!val) return '';
  if (typeof val === 'object') {
    return val[locale] ?? val['tr'] ?? val['en'] ?? '';
  }
  return val ?? '';
}

/**
 * Detects multi-race selection conflicts.
 * Returns a conflict descriptor or null if no conflict.
 *
 * Scenarios:
 *  1. Seçilmek istenen multi-race'in child'larından biri zaten seçili
 *  2. Seçilmek istenen tekil race, seçili bir multi-race'in child'ı
 *  3. İki multi-race aynı child'ı paylaşıyor
 */
function getConflicts(raceId, currentSelectedIds, allRaces) {
  const race = allRaces.find(r => r.id === raceId);
  if (!race) return null;

  const childIds = (race.child_races || []).map(c => c.id);

  // Senaryo 1: Multi-race seçilmek isteniyor → child'larından biri zaten seçili
  if (race.is_multi_race && childIds.length > 0) {
    const conflictingChildren = allRaces.filter(
      r => childIds.includes(r.id) && currentSelectedIds.includes(r.id)
    );
    if (conflictingChildren.length > 0) {
      return { type: 'multi_has_selected_children', conflicts: conflictingChildren, race };
    }
  }

  // Senaryo 2: Tekil race seçilmek isteniyor → seçili bir multi-race onu içeriyor
  const parentMultiRaces = allRaces.filter(
    r =>
      r.is_multi_race &&
      currentSelectedIds.includes(r.id) &&
      (r.child_races || []).some(c => c.id === raceId)
  );
  if (parentMultiRaces.length > 0) {
    return { type: 'child_already_in_multi', conflicts: parentMultiRaces, race };
  }

  // Senaryo 3: İki multi-race aynı child'ı paylaşıyor
  if (race.is_multi_race && childIds.length > 0) {
    const overlappingMultis = allRaces.filter(
      r =>
        r.is_multi_race &&
        r.id !== raceId &&
        currentSelectedIds.includes(r.id) &&
        (r.child_races || []).some(c => childIds.includes(c.id))
    );
    if (overlappingMultis.length > 0) {
      return { type: 'multi_overlap', conflicts: overlappingMultis, race };
    }
  }

  return null;
}

const parsePhone = (val, defaultCountryCode = 'TR') => {
  if (!val) {
    const defaultCountry = COUNTRIES.find(c => c.code === defaultCountryCode) || COUNTRIES[0];
    return { country: defaultCountry, digits: '' };
  }

  const cleanVal = val.trim();
  const startsWithPlus = cleanVal.startsWith('+');
  const digitsOnly = cleanVal.replace(/\D/g, '');

  if (startsWithPlus) {
    const sortedCountries = [...COUNTRIES].sort((a, b) => b.callingCode.length - a.callingCode.length);
    for (const c of sortedCountries) {
      const cleanCallingCode = c.callingCode.replace(/\D/g, '');
      if (digitsOnly.startsWith(cleanCallingCode)) {
        let digits = digitsOnly.slice(cleanCallingCode.length);
        if (digits.startsWith('0') && digits.length > 1) {
          digits = digits.slice(1);
        }
        return { country: c, digits };
      }
    }
  }

  const defaultCountry = COUNTRIES.find(c => c.code === defaultCountryCode) || COUNTRIES[0];
  let digits = digitsOnly;

  const cleanDefaultCallingCode = defaultCountry.callingCode.replace(/\D/g, '');
  if (digits.startsWith(cleanDefaultCallingCode) && digits.length > cleanDefaultCallingCode.length) {
    digits = digits.slice(cleanDefaultCallingCode.length);
  }

  if (digits.startsWith('0') && digits.length > 1) {
    digits = digits.slice(1);
  }

  return { country: defaultCountry, digits };
};

function formatWithMask(digits, mask) {
  if (!digits) return '';
  let formatted = '';
  let digitIndex = 0;
  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '9') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += mask[i];
    }
  }
  return formatted;
}

function PhoneNumberField({
  id,
  value,
  onChange,
  label,
  defaultCountry = 'TR',
}) {
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const { country } = parsePhone(value, defaultCountry);
    return country;
  });

  const [localDigits, setLocalDigits] = useState(() => {
    const { digits } = parsePhone(value, defaultCountry);
    return digits;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const searchInputRef = React.useRef(null);

  const displayValue = useMemo(() => {
    return formatWithMask(localDigits, selectedCountry.mask);
  }, [localDigits, selectedCountry]);

  useEffect(() => {
    const { country, digits } = parsePhone(value, defaultCountry);
    setSelectedCountry(country);
    setLocalDigits(digits);
  }, [value, defaultCountry]);

  useEffect(() => {
    if (isSelectOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSelectOpen]);

  const maxDigits = useMemo(() => {
    return (selectedCountry.mask.match(/9/g) || []).length;
  }, [selectedCountry]);

  const handleInputChange = (event) => {
    const inputVal = event.target.value;

    if (inputVal.includes('+')) {
      const { country, digits } = parsePhone(inputVal, selectedCountry.code);
      setSelectedCountry(country);
      setLocalDigits(digits);
      onChange(digits ? `${country.callingCode}${digits}` : '');
      return;
    }

    let digits = inputVal.replace(/\D/g, '');

    if (digits.startsWith('0') && digits.length > 0) {
      digits = digits.slice(1);
    }

    const truncated = digits.slice(0, maxDigits);
    setLocalDigits(truncated);
    onChange(truncated ? `${selectedCountry.callingCode}${truncated}` : '');
  };

  const handleCountryChange = (nextCountryCode) => {
    const nextCountry = COUNTRIES.find(c => c.code === nextCountryCode) || selectedCountry;
    setSelectedCountry(nextCountry);

    const newMax = (nextCountry.mask.match(/9/g) || []).length;
    const truncatedDigits = localDigits.slice(0, newMax);
    setLocalDigits(truncatedDigits);

    onChange(truncatedDigits ? `${nextCountry.callingCode}${truncatedDigits}` : '');
  };

  const isValid = useMemo(() => {
    if (!localDigits) return false;
    if (selectedCountry.code === 'TR') {
      return localDigits.length === 10 && localDigits.startsWith('5');
    }
    return localDigits.length === maxDigits;
  }, [localDigits, selectedCountry, maxDigits]);

  const resolvedPlaceholder = useMemo(() => {
    return selectedCountry.mask.replace(/9/g, 'X');
  }, [selectedCountry]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.callingCode.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="relative w-full mb-2">
      <InputWrapper
        className={cn(
          'gap-0 px-0 h-12',
          isValid && 'border-emerald-500/60 ring-emerald-500/10'
        )}
      >
        <Select
          value={selectedCountry.code}
          onValueChange={handleCountryChange}
          onOpenChange={(open) => {
            setIsSelectOpen(open);
            if (!open) setSearchQuery('');
          }}
        >
          <SelectTrigger
            className="w-auto min-w-[100px] shrink-0 border-0 bg-transparent shadow-none rounded-none px-3 pe-2 text-foreground focus-visible:border-0 focus-visible:ring-0"
            aria-label="Ülke kodu seç"
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{selectedCountry.flag}</span>
              <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
                {selectedCountry.callingCode}
              </span>
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <div className="p-2 sticky top-0 bg-popover z-10 border-b">
              <Input
                ref={searchInputRef}
                placeholder="Ara... (örn: +90)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs w-full bg-background"
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
            {filteredCountries.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{option.flag}</span>
                  <span>{option.name}</span>
                  <span className="text-muted-foreground">{option.callingCode}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mx-2 h-4 w-px shrink-0 bg-border" />

        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={resolvedPlaceholder}
          value={displayValue}
          onChange={handleInputChange}
          className="h-full border-0 bg-transparent px-0 pe-2 shadow-none focus-visible:ring-0 text-sm sm:text-base"
        />

        {isValid && <CheckCircle2 className="me-3 size-4 shrink-0 text-emerald-600" />}
      </InputWrapper>
      {label && (
        <label
          htmlFor={id}
          className="absolute left-3 pointer-events-none transition-all duration-200 bg-background px-1.5 text-xs text-muted-foreground/80 top-0 -translate-y-1/2"
        >
          {label}
        </label>
      )}
    </div>
  );
}

// Selectable Race Card (modified from race-list-grid's RaceCard)
function SelectableRaceCard({
  race,
  categorySlug,
  isSelected,
  isDisabled,
  isConflicting,
  conflictMessage,
  onToggle,
  index,
  locale = 'tr'
}) {
  const title = getLocalized(race.title, locale);
  const description = getLocalized(race.description, locale);
  const slug = getLocalized(race.slug, locale);

  // Cover image resolution
  let imgUrl = 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80'; // default fallback
  if (race.cover_image && typeof race.cover_image === 'object') {
    imgUrl = race.cover_image.url || imgUrl;
  }
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
  const resolvedImgUrl = imgUrl.startsWith('http') || imgUrl.startsWith('/')
    ? (imgUrl.startsWith('/') && !imgUrl.startsWith('//') ? `${backendUrl}${imgUrl}` : imgUrl)
    : `${backendUrl}/${imgUrl}`;

  // Format date display (e.g. 18 Ekim 2025)
  const formattedDate = useMemo(() => {
    if (!race.start_date) return '';
    const dateObj = new Date(race.start_date);
    return dateObj.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [race.start_date, locale]);

  // Price calculation
  const price = race.price ? parseFloat(race.price) : 0;
  const discountedPrice = race.discounted_price ? parseFloat(race.discounted_price) : 0;
  const hasDiscount = discountedPrice > 0 && discountedPrice < price;
  const isFree = race.is_free || price === 0;
  const discountPercent = price > 0 ? Math.round(((price - discountedPrice) / price) * 100) : 0;

  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md flex flex-col h-full cursor-pointer",
        isSelected && !isConflicting ? "border-primary bg-primary/5" : "",
        isConflicting ? "border-red-400 bg-red-50/50 ring-1 ring-red-300" : "border-border hover:border-primary/20",
        isDisabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
      )}
      onClick={() => !isDisabled && onToggle(race.id)}
    >
      {/* Conflict Warning Banner */}
      {isConflicting && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-red-500 text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1">
          <AlertTriangle className="size-3 shrink-0" />
          <span className="truncate">{conflictMessage || 'Çakışma var'}</span>
        </div>
      )}
      {/* Top Part: Image Container */}
      <div className="relative w-full aspect-video overflow-hidden bg-muted">
        <img
          src={resolvedImgUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80';
          }}
        />


        {/* Selected/Registered Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isDisabled && (
            <div className="bg-green-50 text-green-700 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              Kayıtlı
            </div>
          )}
          {isSelected && !isDisabled && (
            <div className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
              <Check className="size-3" />
              Seçildi
            </div>
          )}
        </div>
      </div>

      {/* Body: Title and Details */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          {description && (
            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 sm:line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Info Grid Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-white/5 pt-2 sm:pt-3">
          {formattedDate && (
            <div className="flex items-center gap-1 truncate" title={formattedDate}>
              <Calendar className="size-3 sm:size-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </div>
          )}
          {race.start_time && (
            <div className="flex items-center gap-1">
              <Clock className="size-3 sm:size-3.5 text-zinc-400 shrink-0" />
              <span>{race.start_time.slice(0, 5)}</span>
            </div>
          )}
          {(race.age_limit_min || race.age_limit_max) && (
            <div className="flex items-center gap-1">
              <User className="size-3 sm:size-3.5 text-zinc-400 shrink-0" />
              <span>{race.age_limit_min ?? '18'}-{race.age_limit_max ?? '75'} Yaş</span>
            </div>
          )}
        </div>

        {/* Price Display */}
        <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
          {isFree ? (
            <span className="text-xs sm:text-sm font-black text-green-600">Ücretsiz</span>
          ) : (
            <div className="flex flex-col">
              {hasDiscount && (
                <span className="line-through text-muted-foreground/45 text-[9px] sm:text-[10px] font-bold leading-none mb-1">
                  {price.toLocaleString('tr-TR')} TRY
                </span>
              )}
              <span className="text-primary font-black text-xs sm:text-sm md:text-base tracking-tight leading-none">
                {(discountedPrice || price).toLocaleString('tr-TR')} TRY
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}



function Step1RaceSelection({ formData, setFormData, categories, conflictWarning, setConflictWarning }) {
  // Filter only race categories (just to be safe, though we passed type=race)
  const raceCategories = categories.filter(c => c.type === 'race' || !c.type);
  const firstCategoryId = raceCategories[0]?.id;

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    formData.selectedCategoryId || firstCategoryId
  );
  const selectedCategory = raceCategories.find((cat) => cat.id === selectedCategoryId);
  // Filter only active races—keep if is_active is true/1/"1", or if is_active is undefined (default to active)
  const selectedCategoryRaces = (selectedCategory?.races || []).filter(race => {
    if (race.is_active === undefined || race.is_active === null) return true; // if no is_active field, default to active
    return race.is_active === true || race.is_active === 1 || race.is_active === "1";
  });

  // DEBUG: child_races verification — remove after testing
  if (typeof window !== 'undefined') {
    const multiRaces = selectedCategoryRaces.filter(r => r.is_multi_race);
    console.log('[ConflictDebug] Multi-races in category:', multiRaces.map(r => ({
      name: r.name || r.title,
      is_multi_race: r.is_multi_race,
      child_races_count: (r.child_races || []).length,
      child_races: (r.child_races || []).map(c => c.name || c.title)
    })));
  }

  // conflictWarning and setConflictWarning are lifted to RegistrationFlow (parent)

  const toggleRaceSelection = (raceId) => {
    const isSelected = formData.selectedRaceIds.includes(raceId);

    // If deselecting, always allow and clear any warning
    if (isSelected) {
      setConflictWarning(null);
      setFormData((prev) => ({
        ...prev,
        selectedCategoryId,
        selectedRaceIds: prev.selectedRaceIds.filter((id) => id !== raceId),
      }));
      return;
    }

    // Check for conflicts before selecting
    const conflict = getConflicts(raceId, formData.selectedRaceIds, selectedCategoryRaces);
    if (conflict) {
      const conflictNames = conflict.conflicts
        .map(r => getLocalized(r.title))
        .join(', ');

      let message = '';
      if (conflict.type === 'multi_has_selected_children') {
        message = `Bu combo'nun içerdiği "${conflictNames}" yarışı zaten seçili. Önce onu kaldırın.`;
      } else if (conflict.type === 'child_already_in_multi') {
        message = `Bu yarış, seçili "${conflictNames}" combo'sunun içinde zaten mevcut.`;
      } else if (conflict.type === 'multi_overlap') {
        message = `Seçili "${conflictNames}" ile ortak yarış içeriyor. İkisi birlikte seçilemez.`;
      }

      setConflictWarning({ raceId, message, conflict });
      return; // Block selection
    }

    // No conflict — proceed normally
    setConflictWarning(null);
    setFormData((prev) => ({
      ...prev,
      selectedCategoryId,
      selectedRaceIds: [...prev.selectedRaceIds, raceId],
    }));
  };

  // Calculate total price
  const { totalPrice, originalTotalPrice } = useMemo(() => {
    return selectedCategoryRaces.reduce((acc, race) => {
      if (formData.selectedRaceIds.includes(race.id)) {
        const price = race.price ? parseFloat(race.price) : 0;
        const discountedPrice = race.discounted_price ? parseFloat(race.discounted_price) : 0;
        acc.originalTotalPrice += price;
        acc.totalPrice += discountedPrice > 0 && discountedPrice < price ? discountedPrice : price;
      }
      return acc;
    }, { totalPrice: 0, originalTotalPrice: 0 });
  }, [selectedCategoryRaces, formData.selectedRaceIds]);

  return (
    <div className="space-y-8">
      {/* Category Selection */}
      {raceCategories.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-foreground">Kategori Seç</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {raceCategories.map((category) => {
              // Filter active races for this category—keep if is_active is true/1/"1" or undefined (default active)
              const activeRaces = (category.races || []).filter(race => {
                if (race.is_active === undefined || race.is_active === null) return true;
                return race.is_active === true || race.is_active === 1 || race.is_active === "1";
              });

              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all duration-200 ${selectedCategoryId === category.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                    }`}
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setFormData((prev) => ({
                      ...prev,
                      selectedCategoryId: category.id,
                      selectedRaceIds: [], // Reset selected races when category changes
                    }));
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Trophy className="size-4 text-primary shrink-0" />
                      {getLocalized(category.name)}
                    </CardTitle>
                    <CardDescription>{activeRaces.length} yarış</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Race Selection */}
      {selectedCategory && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-foreground">Yarışları Seç</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {selectedCategoryRaces.map((race, index) => {
              const isSelected = formData.selectedRaceIds.includes(race.id);
              // TODO: Replace with actual user registration check
              const isDisabled = false;
              const isConflicting = conflictWarning?.raceId === race.id;

              return (
                <SelectableRaceCard
                  key={race.id}
                  race={race}
                  categorySlug={getLocalized(selectedCategory.slug)}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  isConflicting={isConflicting}
                  conflictMessage={isConflicting ? conflictWarning?.message : undefined}
                  onToggle={toggleRaceSelection}
                  index={index}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Summary placeholder removed - handled by sticky bottom bar */}
    </div>
  );
}

function Step2ParticipantForm({ formData, setFormData, participants = [] }) {
  const [useExistingProfile, setUseExistingProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  // When a profile is selected, auto-fill form
  useEffect(() => {
    if (selectedProfileId) {
      const profile = participants.find((p) => p.id === selectedProfileId);
      if (profile) {
        setFormData((prev) => ({
          ...prev,
          participant: {
            fullName: profile.name,
            email: profile.email,
            phone: profile.phone || profile.phone_number,
            birthDate: profile.date_of_birth,
            gender: profile.gender,
            nationality: profile.nationality,
            tckn: profile.identity_number,
            club: profile.club_name,
            bloodType: profile.blood_type,
            shirtSize: profile.t_shirt_size || profile.shirt_size,
            address: profile.address,
            emergencyContact: profile.emergency_contact,
            emergencyPhone: profile.emergency_phone_number,
          },
        }));
      }
    }
  }, [selectedProfileId, setFormData, participants]);

  return (
    <div className="space-y-8">
      {/* Profile Selection */}
      {participants.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-foreground">Geçmiş Katılımcı Profilleri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participants.map((profile) => (
              <Card
                key={profile.id}
                className={`cursor-pointer transition-all duration-200 ${selectedProfileId === profile.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
                  }`}
                onClick={() => {
                  setUseExistingProfile(true);
                  setSelectedProfileId(profile.id);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">{profile.name}</CardTitle>
                  <CardDescription>{profile.email}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUseExistingProfile(false);
                setSelectedProfileId(null);
              }}
            >
              Yeni Katılımcı Formu Doldur
            </Button>
          </div>
        </div>
      )}

      {/* Participant Form */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-foreground">Katılımcı Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingInput
            id="fullName"
            label="Ad Soyad *"
            value={formData.participant.fullName}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, fullName: e.target.value },
              }))
            }
          />
          <FloatingInput
            type="email"
            id="email"
            label="E-posta *"
            value={formData.participant.email}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, email: e.target.value },
              }))
            }
          />
          <PhoneNumberField
            id="phone"
            label="Telefon Numarası *"
            value={formData.participant.phone}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, phone: value },
              }))
            }
          />
          <FloatingInput
            type="date"
            id="birthDate"
            label="Doğum Tarihi *"
            value={formData.participant.birthDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, birthDate: e.target.value },
              }))
            }
          />
          <FloatingSelect
            id="gender"
            label="Cinsiyet *"
            value={formData.participant.gender}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, gender: val },
              }))
            }
          >
            <SelectItem value="Erkek">Erkek</SelectItem>
            <SelectItem value="Kadın">Kadın</SelectItem>
          </FloatingSelect>
          <FloatingSelect
            id="bloodType"
            label="Kan Grubu *"
            value={formData.participant.bloodType}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, bloodType: val },
              }))
            }
          >
            <SelectItem value="A Rh+">A Rh+</SelectItem>
            <SelectItem value="A Rh-">A Rh-</SelectItem>
            <SelectItem value="B Rh+">B Rh+</SelectItem>
            <SelectItem value="B Rh-">B Rh-</SelectItem>
            <SelectItem value="AB Rh+">AB Rh+</SelectItem>
            <SelectItem value="AB Rh-">AB Rh-</SelectItem>
            <SelectItem value="0 Rh+">0 Rh+</SelectItem>
            <SelectItem value="0 Rh-">0 Rh-</SelectItem>
          </FloatingSelect>
          <FloatingInput
            id="nationality"
            label="Uyruk *"
            value={formData.participant.nationality}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, nationality: e.target.value },
              }))
            }
          />
          <FloatingSelect
            id="shirtSize"
            label="Tişört Bedeni *"
            value={formData.participant.shirtSize}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, shirtSize: val },
              }))
            }
          >
            <SelectItem value="XS">XS</SelectItem>
            <SelectItem value="S">S</SelectItem>
            <SelectItem value="M">M</SelectItem>
            <SelectItem value="L">L</SelectItem>
            <SelectItem value="XL">XL</SelectItem>
            <SelectItem value="XXL">XXL</SelectItem>
            <SelectItem value="XXXL">XXXL</SelectItem>
          </FloatingSelect>
          <FloatingInput
            id="tckn"
            label="T.C. Kimlik Numarası *"
            value={formData.participant.tckn}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, tckn: e.target.value },
              }))
            }
          />
          <FloatingInput
            id="club"
            label="Kulüp"
            value={formData.participant.club}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, club: e.target.value },
              }))
            }
          />
          <div className="md:col-span-2">
            <FloatingInput
              id="address"
              label="Adres *"
              value={formData.participant.address}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  participant: { ...prev.participant, address: e.target.value },
                }))
              }
            />
          </div>
          <FloatingInput
            id="emergencyContact"
            label="Acil Durum Kişisi *"
            value={formData.participant.emergencyContact}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, emergencyContact: e.target.value },
              }))
            }
          />
          <PhoneNumberField
            id="emergencyPhone"
            label="Acil Durum Telefon Numarası *"
            value={formData.participant.emergencyPhone}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                participant: { ...prev.participant, emergencyPhone: value },
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}

function Step3Payment({ formData, categories }) {
  // Find selected category and races
  const raceCategories = categories.filter(c => c.type === 'race' || !c.type);
  const selectedCategory = raceCategories.find(c => c.id === formData.selectedCategoryId);
  const activeRaces = (selectedCategory?.races || []).filter(race => {
    if (race.is_active === undefined || race.is_active === null) return true;
    return race.is_active === true || race.is_active === 1 || race.is_active === "1";
  });
  const selectedRaces = activeRaces.filter(r => formData.selectedRaceIds.includes(r.id)) || [];

  const { totalPrice, originalTotalPrice } = useMemo(() => {
    return selectedRaces.reduce((acc, race) => {
      const price = race.price ? parseFloat(race.price) : 0;
      const discountedPrice = race.discounted_price ? parseFloat(race.discounted_price) : 0;
      acc.originalTotalPrice += price;
      acc.totalPrice += discountedPrice > 0 && discountedPrice < price ? discountedPrice : price;
      return acc;
    }, { totalPrice: 0, originalTotalPrice: 0 });
  }, [selectedRaces]);

  const discountAmount = originalTotalPrice - totalPrice;

  return (
    <div className="w-full space-y-8 py-4">
      {/* Registration Summary List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
          <ShieldCheck className="text-primary size-5 shrink-0" />
          <h3 className="text-base font-bold text-foreground">Kayıt ve Ödeme Özeti</h3>
        </div>

        {/* Selected Races List */}
        <div className="space-y-3">
          {selectedRaces.map((race) => {
            const price = race.price ? parseFloat(race.price) : 0;
            const discountedPrice = race.discounted_price ? parseFloat(race.discounted_price) : 0;
            const hasDiscount = discountedPrice > 0 && discountedPrice < price;

            return (
              <div
                key={race.id}
                className="flex justify-between items-center py-1"
              >
                <div className="space-y-1">
                  <span className="font-semibold text-sm sm:text-base text-foreground">
                    {getLocalized(race.title)}
                  </span>
                  {hasDiscount && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <TicketPercent className="size-3" />
                      %{(Math.round((price - discountedPrice) / price * 100)) || 0} İndirim Uygulandı
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {hasDiscount && (
                    <span className="line-through text-muted-foreground/45 text-xs font-semibold block">
                      {price.toLocaleString('tr-TR')} TRY
                    </span>
                  )}
                  <span className="font-bold text-sm sm:text-base text-foreground">
                    {(discountedPrice || price).toLocaleString('tr-TR')} TRY
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calculations */}
        <div className="border-t border-dashed border-zinc-200 pt-4 space-y-2.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Ara Toplam</span>
            <span className="font-medium">{originalTotalPrice.toLocaleString('tr-TR')} TRY</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span className="flex items-center gap-1.5">
                <TicketPercent className="size-4" />
                İndirimler
              </span>
              <span>-{discountAmount.toLocaleString('tr-TR')} TRY</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-zinc-100">
            <span className="font-bold text-base text-foreground">Ödenecek Toplam Tutar</span>
            <div className="text-right">
              <span className="text-2xl font-black text-primary">
                {totalPrice.toLocaleString('tr-TR')} TRY
              </span>
              <span className="text-[10px] text-muted-foreground block font-medium">KDV Dahil</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationFlow({ logoUrl, siteName, logoHeight, categories, participants = [] }) {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    selectedCategoryId: null,
    selectedRaceIds: [],
    participant: {
      fullName: '',
      email: '',
      phone: '',
      birthDate: '',
      gender: '',
      nationality: 'Türkiye',
      tckn: '',
      club: '',
      bloodType: '',
      shirtSize: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
    },
  });

  const totalSteps = 3;
  const raceCategories = categories.filter(c => c.type === 'race' || !c.type);
  const canProceedToStep2 = formData.selectedRaceIds.length > 0;

  const selectedCategory = raceCategories.find(c => c.id === formData.selectedCategoryId);
  const activeRaces = (selectedCategory?.races || []).filter(race => {
    if (race.is_active === undefined || race.is_active === null) return true;
    return race.is_active === true || race.is_active === 1 || race.is_active === "1";
  });
  const selectedRaces = activeRaces.filter(r => formData.selectedRaceIds.includes(r.id)) || [];

  const { totalPrice, originalTotalPrice } = useMemo(() => {
    return selectedRaces.reduce((acc, race) => {
      const price = race.price ? parseFloat(race.price) : 0;
      const discountedPrice = race.discounted_price ? parseFloat(race.discounted_price) : 0;
      acc.originalTotalPrice += price;
      acc.totalPrice += discountedPrice > 0 && discountedPrice < price ? discountedPrice : price;
      return acc;
    }, { totalPrice: 0, originalTotalPrice: 0 });
  }, [selectedRaces]);

  // Lifted from Step1 so the sticky bottom bar can read it
  const [conflictWarning, setConflictWarning] = useState(null);

  const handleNext = () => {
    if (activeStep < totalSteps) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <div className={`py-10 ${activeStep === 1 ? 'pb-24' : ''}`}>
      <Container className="max-w-6xl">
        {/* Centered Logo */}
        <div className="flex justify-center mb-8">
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

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-foreground mb-2">Katılımcı Ol</h1>
          <p className="text-zinc-500">Kolayca yarış seçin ve kaydınızı tamamlayın</p>
        </div>

        <Stepper defaultValue={1} value={activeStep} onValueChange={setActiveStep}>
          <StepperNav className="justify-center mb-10">
            <StepperItem step={1}>
              <StepperTrigger>
                <StepperIndicator>1</StepperIndicator>
                <div className="hidden sm:block">
                  <StepperTitle>Yarış Seç</StepperTitle>
                </div>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
            <StepperItem step={2}>
              <StepperTrigger>
                <StepperIndicator>2</StepperIndicator>
                <div className="hidden sm:block">
                  <StepperTitle>Bilgiler</StepperTitle>
                </div>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
            <StepperItem step={3}>
              <StepperTrigger>
                <StepperIndicator>3</StepperIndicator>
                <div className="hidden sm:block">
                  <StepperTitle>Ödeme</StepperTitle>
                </div>
              </StepperTrigger>
            </StepperItem>
          </StepperNav>

          <div className={activeStep === 3 ? "min-h-[220px]" : "min-h-[500px]"}>
            <StepperContent value={1}>
              <Step1RaceSelection
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                conflictWarning={conflictWarning}
                setConflictWarning={setConflictWarning}
              />
            </StepperContent>
            <StepperContent value={2}>
              <Step2ParticipantForm formData={formData} setFormData={setFormData} participants={participants} />
            </StepperContent>
            <StepperContent value={3}>
              <Step3Payment formData={formData} categories={categories} />
            </StepperContent>
          </div>
        </Stepper>

        {activeStep === 3 ? (
          <div className="flex flex-col items-center gap-3.5 mt-8 w-full">
            <button
              onClick={() => {
                alert("Ödeme sayfasına yönlendiriliyorsunuz...");
              }}
              className="w-full bg-[#ff5500] hover:bg-[#e04a00] active:bg-[#c64100] text-white font-bold transition-all duration-200 shadow-md shadow-orange-600/15 flex items-center justify-center gap-2 px-6 h-12 rounded-xl text-base cursor-pointer"
            >
              <Lock className="size-4 shrink-0 text-white" />
              <span>{totalPrice.toLocaleString('tr-TR')} TRY Güvenli Öde</span>
            </button>
            <Button
              variant="link"
              onClick={handlePrev}
              className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors flex items-center gap-1 mt-1"
            >
              <ChevronLeft className="size-4" />
              Geri Git
            </Button>
          </div>
        ) : activeStep === 2 ? (
          <div className="flex justify-between mt-10">
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePrev}
              disabled={activeStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="size-4" />
              Geri
            </Button>
            <Button
              size="lg"
              onClick={handleNext}
              disabled={activeStep === 1 && !canProceedToStep2}
              className="gap-2"
            >
              Devam Et
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}

        {activeStep === 3 && (() => {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
          const paymentLogosList = [
            { name: 'Visa', src: `${backendUrl}/payment-logos/dikdortgen-logo-visa.jpg` },
            { name: 'Masterpass', src: `${backendUrl}/payment-logos/dikdortgen-logo-masterpass.jpg` },
            { name: 'Troy', src: `${backendUrl}/payment-logos/dikdortgen-logo-troy.jpg` },
            { name: 'BKM Express', src: `${backendUrl}/payment-logos/dikdortgen-logo-bkm.jpg` },
            { name: 'PTT', src: `${backendUrl}/payment-logos/dikdortgen-logo-ptt.jpg` }
          ];
          const sslLogoUrl = `${backendUrl}/payment-logos/ssl-secured-seeklogo-2.svg`;

          return (
            <div className="mt-6 rounded-xl bg-zinc-50/75 border border-zinc-150 p-4 space-y-3.5 w-full">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-emerald-600 text-center">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4.5 shrink-0" />
                  <span className="font-bold text-[11px] sm:text-xs text-foreground uppercase tracking-wider">
                    Güvenli 3D Secure Ödeme Altyapısı
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center items-center pt-2.5 border-t border-zinc-200/50">
                {paymentLogosList.map((logo, idx) => (
                  <div
                    key={idx}
                    className="p-1 bg-white border border-zinc-200 rounded shrink-0 shadow-3xs"
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      style={{ height: '18px' }}
                      className="w-auto object-contain rounded-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </Container>

      {/* Sticky Fixed Bottom Bar for Step 1 */}
      {activeStep === 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          {/* Conflict Warning Strip */}
          {conflictWarning && (
            <div className="bg-red-500 text-white px-4 py-2">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="size-4 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold truncate">{conflictWarning.message}</p>
                </div>
                <button
                  onClick={() => setConflictWarning(null)}
                  className="shrink-0 hover:opacity-75 transition-opacity"
                  aria-label="Uyarıyı kapat"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* Main Bar */}
          <div className="bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-4 py-3 sm:py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] sm:text-xs text-zinc-500 block font-bold uppercase tracking-wider">Toplam Tutar</span>
                <div className="flex items-baseline gap-1.5">
                  {originalTotalPrice > totalPrice && (
                    <span className="line-through text-zinc-400 text-xs sm:text-sm font-bold">
                      {originalTotalPrice.toLocaleString('tr-TR')} TRY
                    </span>
                  )}
                  <p className="text-lg sm:text-2xl font-black text-primary leading-none">
                    {totalPrice.toLocaleString('tr-TR')} TRY
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleNext}
                disabled={!canProceedToStep2}
                className="gap-2 shrink-0 bg-[#03112b] hover:bg-[#03112b]/95 text-white font-bold"
              >
                Devam Et
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
