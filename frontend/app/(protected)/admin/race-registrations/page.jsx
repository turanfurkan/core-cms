'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Edit,
  Plus,
  Search,
  Trash,
  X,
  ClipboardCheck,
  Download,
  FileCheck,
  Venus,
  Mars,
  Trophy,
  Users,
  Shirt,
  Globe,
  Shield,
  Phone
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Container } from '@/components/common/container';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { RightDrawer } from '@/components/common/right-drawer';
import { toast } from 'sonner';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ButtonArrow } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function UserSearchSelect({ value, onChange, users, selectedUserProp }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users matching search term from backend
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users-select-search', debouncedSearch],
    queryFn: async () => {
      const res = await apiFetch(`/api/user-management/users/select?query=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  // Blend loaded matching users with initial list
  const combinedUsers = useMemo(() => {
    const list = usersData || users || [];
    if (value) {
      const exists = list.some(u => String(u.id) === String(value));
      if (!exists) {
        const found = users.find(u => String(u.id) === String(value));
        if (found) {
          return [found, ...list];
        }
      }
    }
    return list;
  }, [usersData, users, value]);

  const selectedUser = useMemo(() => {
    return users.find(u => String(u.id) === String(value)) || 
      (usersData || []).find(u => String(u.id) === String(value)) ||
      selectedUserProp;
  }, [users, usersData, value, selectedUserProp]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          mode="input"
          aria-expanded={open}
          className="w-full justify-between font-normal text-xs h-9 text-left"
        >
          {selectedUser ? (
            <span className="truncate">{selectedUser.name} ({selectedUser.email})</span>
          ) : (
            <span className="text-muted-foreground">Kullanıcı seçin...</span>
          )}
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Kullanıcı ara (isim veya e-posta)..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && <div className="p-2 text-center text-xs text-muted-foreground">Yükleniyor...</div>}
            {!isLoading && combinedUsers.length === 0 && <CommandEmpty>Kullanıcı bulunamadı.</CommandEmpty>}
            <CommandGroup>
              {combinedUsers.map((u) => (
                <CommandItem
                  key={u.id}
                  value={String(u.id)}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <span className="truncate font-medium">{u.name}</span>
                  <span className="ml-2 text-muted-foreground truncate">({u.email})</span>
                  {String(value) === String(u.id) && <CommandCheck className="ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ParticipantSearchSelect({ value, onChange, participants, selectedParticipantProp }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch participants matching search term from backend
  const { data: participantsData, isLoading } = useQuery({
    queryKey: ['admin-participants-select-search', debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        per_page: '100',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const res = await apiFetch(`/api/admin/race-participants?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: open,
  });

  const combinedParticipants = useMemo(() => {
    const list = participantsData || participants || [];
    if (value) {
      const exists = list.some(p => String(p.id) === String(value));
      if (!exists) {
        const found = participants.find(p => String(p.id) === String(value));
        if (found) {
          return [found, ...list];
        }
      }
    }
    return list;
  }, [participantsData, participants, value]);

  const selectedParticipant = useMemo(() => {
    return participants.find(p => String(p.id) === String(value)) || 
      (participantsData || []).find(p => String(p.id) === String(value)) ||
      selectedParticipantProp;
  }, [participants, participantsData, value, selectedParticipantProp]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          mode="input"
          aria-expanded={open}
          className="w-full justify-between font-normal text-xs h-9 text-left"
        >
          {selectedParticipant ? (
            <span className="truncate">{selectedParticipant.name} ({selectedParticipant.identity_number})</span>
          ) : (
            <span className="text-muted-foreground">Sporcu Seçiniz...</span>
          )}
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Sporcu ara (isim veya TC/Pasaport)..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && <div className="p-2 text-center text-xs text-muted-foreground">Yükleniyor...</div>}
            {!isLoading && combinedParticipants.length === 0 && <CommandEmpty>Sporcu bulunamadı.</CommandEmpty>}
            <CommandGroup>
              {combinedParticipants.map((p) => (
                <CommandItem
                  key={p.id}
                  value={String(p.id)}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="ml-2 text-muted-foreground truncate">({p.identity_number || 'TC Girilmemiş'})</span>
                  {String(value) === String(p.id) && <CommandCheck className="ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const countriesList = [
  { code: 'TR', name: 'Türkiye (TR)' },
  { code: 'DE', name: 'Almanya (DE)' },
  { code: 'GB', name: 'Birleşik Krallık (GB)' },
  { code: 'US', name: 'Amerika Birleşik Devletleri (US)' },
  { code: 'RU', name: 'Rusya (RU)' },
  { code: 'UA', name: 'Ukrayna (UA)' },
  { code: 'FR', name: 'Fransa (FR)' },
  { code: 'IT', name: 'İtalya (IT)' },
  { code: 'AF', name: 'Afganistan' },
  { code: 'AL', name: 'Arnavutluk' },
  { code: 'DZ', name: 'Cezayir' },
  { code: 'AS', name: 'Amerikan Samoası' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AI', name: 'Anguilla' },
  { code: 'AG', name: 'Antigua ve Barbuda' },
  { code: 'AR', name: 'Arjantin' },
  { code: 'AM', name: 'Ermenistan' },
  { code: 'AU', name: 'Avustralya' },
  { code: 'AT', name: 'Avusturya' },
  { code: 'AZ', name: 'Azerbaycan' },
  { code: 'BS', name: 'Bahamalar' },
  { code: 'BH', name: 'Bahreyn' },
  { code: 'BD', name: 'Bangladeş' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Beyaz Rusya (Belarus)' },
  { code: 'BE', name: 'Belçika' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BM', name: 'Bermuda' },
  { code: 'BT', name: 'Butan' },
  { code: 'BO', name: 'Bolivya' },
  { code: 'BA', name: 'Bosna Hersek' },
  { code: 'BW', name: 'Botsvana' },
  { code: 'BR', name: 'Brezilya' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgaristan' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'KH', name: 'Kamboçya' },
  { code: 'CM', name: 'Kamerun' },
  { code: 'CA', name: 'Kanada' },
  { code: 'CV', name: 'Yeşil Burun Adaları (Cape Verde)' },
  { code: 'KY', name: 'Cayman Adaları' },
  { code: 'CF', name: 'Orta Afrika Cumhuriyeti' },
  { code: 'TD', name: 'Çad' },
  { code: 'CL', name: 'Şili' },
  { code: 'CN', name: 'Çin' },
  { code: 'CO', name: 'Kolombiya' },
  { code: 'KM', name: 'Komorlar' },
  { code: 'CG', name: 'Kongo' },
  { code: 'CR', name: 'Kosta Rika' },
  { code: 'CI', name: 'Fildişi Sahili' },
  { code: 'HR', name: 'Hırvatistan' },
  { code: 'CU', name: 'Küba' },
  { code: 'CY', name: 'Kıbrıs' },
  { code: 'CZ', name: 'Çekya' },
  { code: 'DK', name: 'Danimarka' },
  { code: 'DJ', name: 'Cibuti' },
  { code: 'DM', name: 'Dominika' },
  { code: 'DO', name: 'Dominik Cumhuriyeti' },
  { code: 'EC', name: 'Ekvador' },
  { code: 'EG', name: 'Mısır' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Ekvator Ginesi' },
  { code: 'ER', name: 'Eritre' },
  { code: 'EE', name: 'Estonya' },
  { code: 'SZ', name: 'Esvatini' },
  { code: 'ET', name: 'Etiyopya' },
  { code: 'FI', name: 'Finlandiya' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambiya' },
  { code: 'GE', name: 'Gürcistan' },
  { code: 'GH', name: 'Gana' },
  { code: 'GR', name: 'Yunanistan' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Gine' },
  { code: 'GW', name: 'Gine-Bissau' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Macaristan' },
  { code: 'IS', name: 'İzlanda' },
  { code: 'IN', name: 'Hindistan' },
  { code: 'ID', name: 'Endonezya' },
  { code: 'IR', name: 'İran' },
  { code: 'IQ', name: 'Irak' },
  { code: 'IE', name: 'İrlanda' },
  { code: 'IL', name: 'İsrail' },
  { code: 'JM', name: 'Jamaika' },
  { code: 'JP', name: 'Japonya' },
  { code: 'JO', name: 'Ürdün' },
  { code: 'KZ', name: 'Kazakistan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'Güney Kore' },
  { code: 'KW', name: 'Kuveyt' },
  { code: 'KG', name: 'Kırgızistan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Letonya' },
  { code: 'LB', name: 'Lübnan' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberya' },
  { code: 'LY', name: 'Libya' },
  { code: 'LT', name: 'Litvanya' },
  { code: 'LU', name: 'Lüksemburg' },
  { code: 'MO', name: 'Makao' },
  { code: 'MG', name: 'Madagaskar' },
  { code: 'MW', name: 'Malavi' },
  { code: 'MY', name: 'Malezya' },
  { code: 'MV', name: 'Maldivler' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Adaları' },
  { code: 'MR', name: 'Moritanya' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MX', name: 'Meksika' },
  { code: 'FM', name: 'Mikronezya' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monako' },
  { code: 'MN', name: 'Moğolistan' },
  { code: 'ME', name: 'Karadağ' },
  { code: 'MA', name: 'Fas' },
  { code: 'MZ', name: 'Mozambik' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibya' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Hollanda' },
  { code: 'NZ', name: 'Yeni Zelanda' },
  { code: 'NI', name: 'Nikaragua' },
  { code: 'NG', name: 'Nijerya' },
  { code: 'NO', name: 'Norveç' },
  { code: 'OM', name: 'Umman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua Yeni Gine' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Filipinler' },
  { code: 'PL', name: 'Polonya' },
  { code: 'PT', name: 'Portekiz' },
  { code: 'QA', name: 'Katar' },
  { code: 'RO', name: 'Romanya' },
  { code: 'RW', name: 'Ruanda' },
  { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' },
  { code: 'SA', name: 'Suudi Arabistan' },
  { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Sırbistan' },
  { code: 'SG', name: 'Singapur' },
  { code: 'SK', name: 'Slovakya' },
  { code: 'SI', name: 'Slovenya' },
  { code: 'ZA', name: 'Güney Afrika' },
  { code: 'ES', name: 'İspanya' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SE', name: 'İsveç' },
  { code: 'CH', name: 'İsviçre' },
  { code: 'SY', name: 'Suriye' },
  { code: 'TW', name: 'Tayvan' },
  { code: 'TJ', name: 'Tacikistan' },
  { code: 'TZ', name: 'Tanzanya' },
  { code: 'TH', name: 'Tayland' },
  { code: 'UG', name: 'Uganda' },
  { code: 'AE', name: 'Birleşik Arap Emirlikleri' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Özbekistan' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ZM', name: 'Zambiya' },
  { code: 'ZW', name: 'Zimbabve' }
];

function CountrySearchSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCountry = useMemo(() => {
    return countriesList.find(c => String(c.code).toLowerCase() === String(value).toLowerCase() || String(c.name).toLowerCase() === String(value).toLowerCase());
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!search) return countriesList;
    const searchLower = search.toLowerCase();
    return countriesList.filter(c => 
      c.name.toLowerCase().includes(searchLower) || 
      c.code.toLowerCase().includes(searchLower)
    );
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          mode="input"
          aria-expanded={open}
          className="w-full justify-between font-normal text-xs h-9 text-left font-sans"
        >
          {selectedCountry ? (
            <span className="truncate">{selectedCountry.name}</span>
          ) : (
            <span className="text-muted-foreground">{value || 'Uyruk seçin...'}</span>
          )}
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Ülke ara..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <ScrollArea viewportClassName="max-h-[220px] [&>div]:block!">
              {filteredCountries.length === 0 && <CommandEmpty>Ülke bulunamadı.</CommandEmpty>}
              <CommandGroup>
                {filteredCountries.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={c.name}
                    onSelect={() => {
                      onChange(c.name);
                      setOpen(false);
                    }}
                    className="text-xs"
                  >
                    <span>{c.name}</span>
                    {(String(value).toLowerCase() === String(c.code).toLowerCase() || String(value).toLowerCase() === String(c.name).toLowerCase()) && <CommandCheck className="ml-auto" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const normalizeBloodType = (type) => {
  if (!type) return '';
  let clean = type.toUpperCase().replace(/\s+/g, '');
  clean = clean.replace('RH', '');
  if (clean.startsWith('0')) {
    clean = 'O' + clean.slice(1);
  }
  return clean;
};

const normalizeTShirtSize = (size) => {
  if (!size) return '';
  return size.toLowerCase().trim();
};

const normalizeNationality = (nationality) => {
  if (!nationality) return '';
  const clean = nationality.toLowerCase().trim();
  if (clean === 'türkiye' || clean === 'turkey' || clean === 'tr' || clean === 'tur') return 'Türkiye (TR)';
  if (clean === 'germany' || clean === 'de' || clean === 'deutschland') return 'Almanya (DE)';
  if (clean === 'united kingdom' || clean === 'uk' || clean === 'gb' || clean === 'england') return 'Birleşik Krallık (GB)';
  if (clean === 'united states' || clean === 'usa' || clean === 'us') return 'Amerika Birleşik Devletleri (US)';
  if (clean === 'russia' || clean === 'ru') return 'Rusya (RU)';
  if (clean === 'ukraine' || clean === 'ua') return 'Ukrayna (UA)';
  if (clean === 'france' || clean === 'fr') return 'Fransa (FR)';
  if (clean === 'italy' || clean === 'it') return 'İtalya (IT)';
  
  if (typeof countriesList !== 'undefined') {
    const found = countriesList.find(c => c.name.toLowerCase().includes(clean) || c.code.toLowerCase() === clean);
    if (found) return found.name;
  }
  return nationality;
};

export default function RegistrationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Listing state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [raceFilter, setRaceFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [tShirtFilter, setTShirtFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [pendingDrawerOpen, setPendingDrawerOpen] = useState(false);

  // Export Settings State
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    bib_number: true,
    race_name: true,
    name: true,
    identity_number: true,
    dob: true,
    contest: true,
    club: true,
    phone: true,
    gender: true,
    nationality: true,
    t_shirt: true,
  });

  const handleToggleAllColumns = (checked) => {
    setExportColumns(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        updated[key] = !!checked;
      });
      return updated;
    });
  };

  const isAllColumnsSelected = Object.values(exportColumns).every(val => val === true);
  const selectedColumnsCount = Object.values(exportColumns).filter(Boolean).length;

  useEffect(() => {
    const timer = setTimeout(() => {
      setApiSearchQuery(searchQuery);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Drawer / Form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isNewParticipant, setIsNewParticipant] = useState(false);
  const [newParticipantData, setNewParticipantData] = useState({
    user_id: '',
    race_id: '',
    name: '',
    identity_number: '',
    phone_number: '',
    date_of_birth: '',
    gender: 'male',
    blood_type: '',
    t_shirt_size: '',
    club_name: '',
    nationality: 'TR',
    emergency_contact: '',
    emergency_phone_number: '',
    address: '',
    bib_number: '',
    status: 'paid',
    certificate_status: 'approved',
  });

  // Delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // Fetch Registrations (Only paid/approved)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-registrations', pagination, sorting, apiSearchQuery, raceFilter, genderFilter, tShirtFilter, nationalityFilter],
    queryFn: async () => {
      const sortField = sorting?.[0]?.id || 'id';
      const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        per_page: String(pagination.pageSize),
        sort: sortField,
        dir: sortDirection,
        status: 'paid',
        ...(apiSearchQuery ? { search: apiSearchQuery } : {}),
        ...(raceFilter !== 'all' ? { race_id: raceFilter } : {}),
        ...(genderFilter !== 'all' ? { gender: genderFilter } : {}),
        ...(tShirtFilter !== 'all' ? { t_shirt_size: tShirtFilter } : {}),
        ...(nationalityFilter !== 'all' ? { nationality: nationalityFilter } : {}),
      });

      const res = await apiFetch(`/api/admin/race-registrations?${params.toString()}`);
      if (!res.ok) throw new Error('Yarış kayıtları yüklenemedi');
      return res.json();
    },
  });

  // Fetch Pending Registrations (for count & approval drawer)
  const { data: pendingData } = useQuery({
    queryKey: ['admin-registrations-pending'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/race-registrations?status=pending&per_page=1000');
      if (!res.ok) throw new Error('Onay bekleyen kayıtlar yüklenemedi');
      return res.json();
    }
  });

  const pendingCount = pendingData?.meta?.total || 0;

  // Fetch Races (for dropdowns)
  const { data: racesData } = useQuery({
    queryKey: ['admin-races-list'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/races?limit=100');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  // Fetch Participants (for adding new manual registrations)
  const { data: participantsData } = useQuery({
    queryKey: ['admin-participants-list'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/race-participants?limit=100');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  // Fetch Users (for new participant creation)
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const res = await apiFetch('/api/user-management/users/select');
      if (!res.ok) return [];
      const json = await res.json();
      return json || [];
    }
  });

  // Create or Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const isEdit = !!selectedRegistration;
      
      if (isEdit) {
        // 1. Update Participant
        const resParticipant = await apiFetch(`/api/admin/race-participants/${payload.participant_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: payload.user_id,
            name: payload.name,
            gender: payload.gender,
            date_of_birth: payload.date_of_birth,
            identity_number: payload.identity_number,
            blood_type: payload.blood_type,
            phone_number: payload.phone_number,
            t_shirt_size: payload.t_shirt_size,
            club_name: payload.club_name,
            nationality: payload.nationality,
            emergency_contact: payload.emergency_contact,
            emergency_phone_number: payload.emergency_phone_number,
            address: payload.address,
          }),
        });

        if (!resParticipant.ok) {
          const errorData = await resParticipant.json();
          throw new Error(errorData.message || 'Sporcu bilgileri güncellenemedi');
        }

        // 2. Update Registration
        const resRegistration = await apiFetch(`/api/admin/race-registrations/${selectedRegistration.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant_id: payload.participant_id,
            race_id: payload.race_id,
            user_id: payload.user_id,
            price: payload.price,
            bib_number: payload.bib_number,
            status: payload.status,
            certificate_status: payload.certificate_status,
          }),
        });

        if (!resRegistration.ok) {
          const errorData = await resRegistration.json();
          throw new Error(errorData.message || 'Kayıt bilgileri güncellenemedi');
        }

        return resRegistration.json();
      } else {
        // Create mode
        const res = await apiFetch('/api/admin/race-participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            // Include create-only values
            status: payload.status || 'paid',
            certificate_status: payload.certificate_status || 'approved',
            bib_number: payload.bib_number || '',
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Kayıt oluşturulamadı');
        }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-participants-list'] });
      toast.success(selectedRegistration ? 'Kayıt güncellendi' : 'Kayıt oluşturuldu');
      setDrawerOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Bir hata oluştu');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/race-registrations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Kayıt silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      toast.success('Kayıt silindi');
      setDeleteConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Silme işlemi başarısız');
    },
  });

  const handleEditClick = (reg) => {
    setSelectedRegistration(reg);
    setIsNewParticipant(true);
    
    const p = reg.participant || {};
    setNewParticipantData({
      user_id: reg.user_id ? String(reg.user_id) : '',
      race_id: reg.race_id ? String(reg.race_id) : '',
      name: p.name || '',
      identity_number: p.identity_number || '',
      phone_number: p.phone_number || '',
      date_of_birth: p.date_of_birth ? p.date_of_birth.split('T')[0] : '',
      gender: p.gender || 'male',
      blood_type: normalizeBloodType(p.blood_type),
      t_shirt_size: normalizeTShirtSize(p.t_shirt_size),
      club_name: p.club_name || '',
      nationality: normalizeNationality(p.nationality),
      emergency_contact: p.emergency_contact || '',
      emergency_phone_number: p.emergency_phone_number || '',
      address: p.address || '',
      bib_number: reg.bib_number || '',
      status: reg.status || 'pending',
      certificate_status: reg.certificate_status || 'pending',
    });
    setDrawerOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedRegistration(null);
    setIsNewParticipant(true);
    setNewParticipantData({
      user_id: '',
      race_id: '',
      name: '',
      identity_number: '',
      phone_number: '',
      date_of_birth: '',
      gender: 'male',
      blood_type: '',
      t_shirt_size: '',
      club_name: '',
      nationality: 'TR',
      emergency_contact: '',
      emergency_phone_number: '',
      address: '',
      bib_number: '',
      status: 'paid',
      certificate_status: 'approved',
    });
    setDrawerOpen(true);
  };

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedRegistration) {
      saveMutation.mutate({
        ...newParticipantData,
        participant_id: Number(selectedRegistration.participant_id),
        user_id: Number(newParticipantData.user_id),
        race_id: Number(newParticipantData.race_id),
        price: Number(selectedRegistration.price || 0),
      });
    } else {
      saveMutation.mutate({
        ...newParticipantData,
        is_new_participant: true,
        user_id: Number(newParticipantData.user_id),
        race_id: Number(newParticipantData.race_id),
      });
    }
  };

  const handleApprovePending = async (registration) => {
    try {
      const res = await apiFetch(`/api/admin/race-registrations/${registration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          race_id: String(registration.race_id),
          participant_id: String(registration.participant_id),
          bib_number: registration.bib_number || '',
          status: 'paid',
          certificate_status: registration.certificate_status || 'pending',
        }),
      });
      if (!res.ok) throw new Error('Onaylama işlemi başarısız');
      toast.success('Ödeme onaylandı');
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-registrations-pending'] });
    } catch (err) {
      toast.error(err.message || 'Hata oluştu');
    }
  };

  // CSV Export
  const handleExecuteExport = async () => {
    if (selectedColumnsCount === 0) {
      toast.error('Lütfen dışa aktarılacak en az bir sütun seçiniz.');
      return;
    }
    
    setIsExporting(true);
    try {
      const sortField = sorting?.[0]?.id || 'id';
      const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
      
      const params = new URLSearchParams({
        page: '1',
        per_page: '100000',
        sort: sortField,
        dir: sortDirection,
        status: 'paid',
        ...(apiSearchQuery ? { search: apiSearchQuery } : {}),
        ...(raceFilter !== 'all' ? { race_id: raceFilter } : {}),
        ...(genderFilter !== 'all' ? { gender: genderFilter } : {}),
        ...(tShirtFilter !== 'all' ? { t_shirt_size: tShirtFilter } : {}),
        ...(nationalityFilter !== 'all' ? { nationality: nationalityFilter } : {}),
      });

      const res = await apiFetch(`/api/admin/race-registrations?${params.toString()}`);
      if (!res.ok) throw new Error('Veriler yüklenemedi');
      const allData = await res.json();
      const records = allData.data || [];

      if (records.length === 0) {
        toast.error('Dışarı aktarılacak veri bulunamadı.');
        return;
      }

      let processedRecords = [];

      if (exportType === 'all') {
        processedRecords = records;
      } else if (exportType === 'unique_participants') {
        const seen = new Set();
        records.forEach(item => {
          const key = item.participant?.identity_number || item.participant?.id;
          if (key && !seen.has(key)) {
            seen.add(key);
            processedRecords.push(item);
          }
        });
      } else if (exportType === 'combined_summary') {
        const grouped = {};
        records.forEach(item => {
          const key = item.participant?.identity_number || item.participant?.id;
          if (key) {
            if (!grouped[key]) {
              grouped[key] = {
                ...item,
                race_names: [item.race?.name || '-'],
                bib_numbers: item.bib_number ? [item.bib_number] : [],
              };
            } else {
              if (item.race?.name) {
                grouped[key].race_names.push(item.race.name);
              }
              if (item.bib_number) {
                grouped[key].bib_numbers.push(item.bib_number);
              }
            }
          }
        });
        processedRecords = Object.values(grouped).map(item => ({
          ...item,
          combined_races: Array.from(new Set(item.race_names)).join(', '),
          combined_bibs: item.bib_numbers.length > 0 ? Array.from(new Set(item.bib_numbers)).join(', ') : '-',
        }));
      }

      const headers = [];
      const colKeys = [];

      if (exportColumns.bib_number) {
        headers.push("Bib Numarası");
        colKeys.push("bib_number");
      }
      if (exportColumns.race_name) {
        headers.push("Yarış");
        colKeys.push("race_name");
      }
      if (exportColumns.name) {
        headers.push("Katılımcı Adı");
        colKeys.push("name");
      }
      if (exportColumns.identity_number) {
        headers.push("Kimlik / Pasaport No");
        colKeys.push("identity_number");
      }
      if (exportColumns.dob) {
        headers.push("Doğum Yılı");
        colKeys.push("dob");
      }
      if (exportColumns.contest) {
        headers.push("Contest");
        colKeys.push("contest");
      }
      if (exportColumns.club) {
        headers.push("Kulüp");
        colKeys.push("club");
      }
      if (exportColumns.phone) {
        headers.push("Telefon");
        colKeys.push("phone");
      }
      if (exportColumns.gender) {
        headers.push("Cinsiyet");
        colKeys.push("gender");
      }
      if (exportColumns.nationality) {
        headers.push("Uyruk");
        colKeys.push("nationality");
      }
      if (exportColumns.t_shirt) {
        headers.push("T-Shirt Bedeni");
        colKeys.push("t_shirt");
      }

      const csvRows = processedRecords.map(item => {
        const row = [];
        colKeys.forEach(key => {
          if (key === "bib_number") {
            row.push(exportType === 'combined_summary' ? item.combined_bibs : (item.bib_number || ''));
          } else if (key === "race_name") {
            row.push(exportType === 'combined_summary' ? item.combined_races : (item.race?.name || ''));
          } else if (key === "name") {
            row.push(item.participant?.name || '');
          } else if (key === "identity_number") {
            row.push(item.participant?.identity_number || '');
          } else if (key === "dob") {
            const dob = item.participant?.date_of_birth;
            row.push(dob ? dob.substring(0, 4) : '');
          } else if (key === "contest") {
            row.push(item.race?.contest_id ?? '');
          } else if (key === "club") {
            row.push(item.participant?.club_name || '');
          } else if (key === "phone") {
            row.push(item.participant?.phone_number || '');
          } else if (key === "gender") {
            row.push(item.participant?.gender === 'male' ? 'M' : (item.participant?.gender === 'female' ? 'F' : ''));
          } else if (key === "nationality") {
            row.push(item.participant?.nationality || '');
          } else if (key === "t_shirt") {
            row.push(item.participant?.t_shirt_size?.toUpperCase() || '');
          }
        });
        return row;
      });

      const csvContent = "\uFEFF" + [headers.join(','), ...csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `yarish_kayitlari_${exportType}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Dışa aktarım başarıyla tamamlandı.');
      setExportDrawerOpen(false);
    } catch (err) {
      toast.error('Dışa aktarım sırasında bir hata oluştu.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const getCountryCode = (nationality) => {
    if (!nationality) return null;
    const clean = nationality.toLowerCase().trim();
    if (clean === 'türkiye' || clean === 'turkey' || clean === 'tr' || clean === 'tur') return 'tr';
    if (clean === 'germany' || clean === 'de' || clean === 'deutschland') return 'de';
    if (clean === 'united kingdom' || clean === 'uk' || clean === 'gb' || clean === 'england') return 'gb';
    if (clean === 'united states' || clean === 'usa' || clean === 'us') return 'us';
    if (clean === 'russia' || clean === 'ru') return 'ru';
    if (clean === 'ukraine' || clean === 'ua') return 'ua';
    if (clean === 'france' || clean === 'fr') return 'fr';
    if (clean === 'italy' || clean === 'it') return 'it';
    return null;
  };

  // Columns definition
  const columns = useMemo(() => [
    {
      accessorKey: 'bib_number',
      id: 'bib_number',
      header: "BİB",
      cell: ({ row }) => {
        const bib = row.original.bib_number || String(row.original.id);
        return (
          <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5 bg-muted/30">
            #{bib}
          </Badge>
        );
      },
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 text-center w-[70px] max-w-[70px]',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold text-center w-[70px] max-w-[70px]',
        skeleton: <Skeleton className="w-12 h-5" />
      },
    },
    {
      accessorKey: 'race.name',
      id: 'race_name',
      header: "Yarış",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 min-w-[200px]">
          <Trophy className="size-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold text-foreground break-words truncate">
            {row.original.race?.name || '-'}
          </span>
        </div>
      ),
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 min-w-[200px]',
        headerClassName: 'text-[13px] py-2 px-3 pr-8 font-semibold whitespace-nowrap min-w-[200px]',
        skeleton: <Skeleton className="w-24 h-5" />
      },
    },
    {
      accessorKey: 'participant.name',
      id: 'participant_name',
      header: ({ column }) => (
        <DataGridColumnHeader title="Katılımcı" column={column} visibility />
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground capitalize">
          {row.original.participant?.name || 'Bilinmiyor'}
        </span>
      ),
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 max-w-[160px] truncate',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold',
        skeleton: <Skeleton className="w-24 h-5" />
      },
    },

    {
      accessorKey: 'participant.date_of_birth',
      id: 'dob_year',
      header: "Doğum Yılı",
      cell: ({ row }) => {
        const dob = row.original.participant?.date_of_birth;
        if (!dob) return '-';
        return dob.substring(0, 4);
      },
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 text-center',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold text-center',
        skeleton: <Skeleton className="w-12 h-5" />
      },
    },
    {
      accessorKey: 'race.contest_id',
      id: 'contest_id',
      header: "Contest",
      cell: ({ row }) => row.original.race?.contest_id ?? '-',
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 text-center w-[70px] max-w-[70px]',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold text-center w-[70px] max-w-[70px]',
        skeleton: <Skeleton className="w-12 h-5" />
      },
    },
    {
      accessorKey: 'participant.club_name',
      id: 'club_name',
      header: "Kulüp",
      cell: ({ row }) => {
        const club = row.original.participant?.club_name;
        if (!club || club === '-') return '-';
        return (
          <div className="flex items-center gap-1.5 max-w-[130px] truncate">
            <Shield className="size-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="truncate">{club}</span>
          </div>
        );
      },
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 max-w-[130px] truncate',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold',
        skeleton: <Skeleton className="w-16 h-5" />
      },
    },
    {
      accessorKey: 'participant.phone_number',
      id: 'phone_number',
      header: "Telefon",
      cell: ({ row }) => {
        const phone = row.original.participant?.phone_number;
        if (!phone || phone === '-') return '-';
        return (
          <div className="flex items-center gap-1.5">
            <Phone className="size-3.5 text-muted-foreground/80 shrink-0" />
            <span>{phone}</span>
          </div>
        );
      },
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 font-mono',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold',
        skeleton: <Skeleton className="w-20 h-5" />
      },
    },
    {
      accessorKey: 'participant.gender',
      id: 'gender',
      header: "Cinsiyet",
      cell: ({ row }) => {
        const gender = row.original.participant?.gender;
        if (gender === 'male') {
          return (
            <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
              <Mars className="size-3.5 stroke-[2.5]" />
              <span>M</span>
            </div>
          );
        }
        if (gender === 'female') {
          return (
            <div className="flex items-center justify-center gap-1 text-rose-500 dark:text-rose-400 font-semibold">
              <Venus className="size-3.5 stroke-[2.5]" />
              <span>F</span>
            </div>
          );
        }
        return gender || '-';
      },
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 text-center w-[80px] max-w-[80px]',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold text-center w-[80px] max-w-[80px]',
        skeleton: <Skeleton className="w-8 h-5" />
      },
    },
    {
      accessorKey: 'participant.nationality',
      id: 'nationality',
      header: "Uyruk",
      cell: ({ row }) => {
        const nationality = row.original.participant?.nationality;
        const code = getCountryCode(nationality);
        return (
          <div className="flex items-center justify-center gap-1.5">
            {code && (
              <img
                src={`https://flagcdn.com/16x12/${code}.png`}
                width="16"
                height="12"
                alt={nationality}
                className="rounded-xs shadow-2xs shrink-0"
              />
            )}
            <span>{nationality || '-'}</span>
          </div>
        );
      },
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 text-center w-[120px] max-w-[120px]',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold text-center w-[120px] max-w-[120px]',
        skeleton: <Skeleton className="w-12 h-5" />
      },
    },
    {
      accessorKey: 'participant.t_shirt_size',
      id: 't_shirt_size',
      header: "T-Shirt",
      cell: ({ row }) => {
        const size = row.original.participant?.t_shirt_size;
        if (!size) return '-';
        return (
          <div className="flex items-center justify-center gap-1">
            <Shirt className="size-3.5 text-muted-foreground/80 shrink-0" />
            <span className="font-semibold text-foreground">{size.toUpperCase()}</span>
          </div>
        );
      },
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 text-center w-[85px] max-w-[85px]',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold text-center w-[85px] max-w-[85px]',
        skeleton: <Skeleton className="w-10 h-5" />
      },
    },


    {
      accessorKey: 'created_at',
      id: 'created_at',
      header: "Kayıt Tarihi",
      cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('tr-TR') : '-',
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 text-center whitespace-nowrap',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold text-center',
        skeleton: <Skeleton className="w-16 h-5" />
      },
    },
    {
      id: 'actions',
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditClick(row.original)}>
            <Edit className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteClick(row.original.id)}>
            <Trash className="size-4" />
          </Button>
        </div>
      ),
      meta: {
        cellClassName: 'text-[13px] py-2 px-3 text-end',
        headerClassName: 'text-[13px] py-2 px-3 font-semibold text-end',
        skeleton: <Skeleton className="size-7" />
      },
    }
  ], []);

  const table = useReactTable({
    columns,
    data: data?.data || [],
    pageCount: Math.ceil((data?.meta?.total || 0) / pagination.pageSize),
    getRowId: (row) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const Toolbar = () => {
    return (
      <CardHeader className="py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Kayıtlarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 w-full md:w-56"
            />
            {searchQuery && (
              <Button variant="ghost" className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => { setSearchQuery(''); }}>
                <X className="size-3.5" />
              </Button>
            )}
          </div>

          {/* Race Filter */}
          <Select value={raceFilter} onValueChange={(val) => { setRaceFilter(val); setPagination({ ...pagination, pageIndex: 0 }); }}>
            <SelectTrigger className="w-[210px] text-xs">
              <div className="flex items-center gap-1.5 truncate text-left w-full">
                <Trophy className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">Yarış:</span>
                <span className="font-semibold truncate">
                  {raceFilter === 'all' 
                    ? 'Hepsi' 
                    : (racesData || []).find(r => String(r.id) === raceFilter)?.name || 'Seçili'
                  }
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hepsi</SelectItem>
              {(racesData || []).map(race => (
                <SelectItem key={race.id} value={String(race.id)}>{race.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Gender Filter */}
          <Select value={genderFilter} onValueChange={(val) => { setGenderFilter(val); setPagination({ ...pagination, pageIndex: 0 }); }}>
            <SelectTrigger className="w-[150px] text-xs">
              <div className="flex items-center gap-1.5 text-left w-full">
                <Users className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">Cinsiyet:</span>
                <span className="font-semibold">
                  {genderFilter === 'all' ? 'Hepsi' : genderFilter === 'male' ? 'M' : 'F'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hepsi</SelectItem>
              <SelectItem value="male">Erkek (M)</SelectItem>
              <SelectItem value="female">Kadın (F)</SelectItem>
            </SelectContent>
          </Select>

          {/* T-Shirt Size Filter */}
          <Select value={tShirtFilter} onValueChange={(val) => { setTShirtFilter(val); setPagination({ ...pagination, pageIndex: 0 }); }}>
            <SelectTrigger className="w-[140px] text-xs">
              <div className="flex items-center gap-1.5 text-left w-full">
                <Shirt className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">Tişört:</span>
                <span className="font-semibold">
                  {tShirtFilter === 'all' ? 'Hepsi' : tShirtFilter.toUpperCase()}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hepsi</SelectItem>
              {['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '3xl'].map(size => (
                <SelectItem key={size} value={size}>{size.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Nationality Filter */}
          <Select value={nationalityFilter} onValueChange={(val) => { setNationalityFilter(val); setPagination({ ...pagination, pageIndex: 0 }); }}>
            <SelectTrigger className="w-[155px] text-xs">
              <div className="flex items-center gap-1.5 text-left w-full">
                <Globe className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">Uyruk:</span>
                <span className="font-semibold">
                  {nationalityFilter === 'all' ? 'Hepsi' : nationalityFilter === 'TR' ? 'TR' : 'Yabancı'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hepsi</SelectItem>
              <SelectItem value="TR">Türkiye (TR)</SelectItem>
              <SelectItem value="foreign">Yabancı</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Button
              onClick={() => setPendingDrawerOpen(true)}
              variant="outline"
              className="gap-1.5 h-9 font-semibold text-xs border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:text-amber-700"
            >
              <ClipboardCheck className="size-4" /> Onay Bekleyenler ({pendingCount})
            </Button>
          )}
          <Button variant="outline" onClick={() => setExportDrawerOpen(true)} className="gap-1.5 h-9 font-semibold text-xs border-border bg-card">
            <Download className="size-4" /> Dışarı Aktar
          </Button>
          <Button onClick={handleCreateClick} className="gap-1.5 font-semibold text-xs h-9 rounded-lg">
            <Plus className="size-4" /> Yeni Kayıt Ekle
          </Button>
        </div>
      </CardHeader>
    );
  };

  return (
    <Container className="space-y-6" width="fluid">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Ana Sayfa</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Yarış Kayıtları</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Kayıt Yönetimi</h1>
        <p className="text-xs md:text-sm text-muted-foreground/80">
          Sporcuların hangi yarışlara katıldığını görebilir, göğüs numarası atayabilir ve sağlık belgesi durumlarını onaylayabilirsiniz.
        </p>
      </div>

      <DataGrid
        table={table}
        recordCount={data?.meta?.total || 0}
        isLoading={isLoading}
        tableLayout={{ columnsResizable: false }}
      >
        <Card>
          <Toolbar />
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <RightDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selectedRegistration ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'} size="2xl">
        <div className="space-y-4 p-5">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="user_id" className="text-foreground">Kullanıcı Seç <span className="text-destructive">*</span></Label>
                <UserSearchSelect
                  value={newParticipantData.user_id}
                  onChange={async (val) => {
                    setNewParticipantData(prev => ({ ...prev, user_id: val }));
                    if (val) {
                      try {
                        const res = await apiFetch(`/api/admin/race-participants?user_id=${val}`);
                        if (res.ok) {
                          const json = await res.json();
                          const existingParticipant = json.data?.[0];
                          if (existingParticipant) {
                            setNewParticipantData(prev => ({
                              ...prev,
                              name: existingParticipant.name || '',
                              identity_number: existingParticipant.identity_number || '',
                              phone_number: existingParticipant.phone_number || '',
                              date_of_birth: existingParticipant.date_of_birth ? existingParticipant.date_of_birth.split('T')[0] : '',
                              gender: existingParticipant.gender || 'male',
                              blood_type: normalizeBloodType(existingParticipant.blood_type),
                              t_shirt_size: normalizeTShirtSize(existingParticipant.t_shirt_size),
                              club_name: existingParticipant.club_name || '',
                              nationality: normalizeNationality(existingParticipant.nationality),
                              emergency_contact: existingParticipant.emergency_contact || '',
                              emergency_phone_number: existingParticipant.emergency_phone_number || '',
                              address: existingParticipant.address || '',
                            }));
                            toast.info('Seçilen kullanıcının mevcut sporcu bilgileri otomatik yüklendi.');
                          }
                        }
                      } catch (error) {
                        console.error('Error fetching existing participant:', error);
                      }
                    }
                  }}
                  users={usersData || []}
                  selectedUserProp={selectedRegistration?.participant?.user}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="race_id" className="text-foreground">Yarış Seç <span className="text-destructive">*</span></Label>
                <Select value={newParticipantData.race_id} onValueChange={(val) => setNewParticipantData({ ...newParticipantData, race_id: val })}>
                  <SelectTrigger id="race_id">
                    <SelectValue placeholder="Yarış seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {(racesData || []).map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-foreground">Ad Soyad <span className="text-destructive">*</span></Label>
                <Input id="name" required value={newParticipantData.name} onChange={(e) => setNewParticipantData({ ...newParticipantData, name: e.target.value })} placeholder="Ad soyad giriniz" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone_number" className="text-foreground">Telefon Numarası <span className="text-destructive">*</span></Label>
                <Input id="phone_number" required value={newParticipantData.phone_number} onChange={(e) => setNewParticipantData({ ...newParticipantData, phone_number: e.target.value })} placeholder="Telefon numarası" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="identity_number" className="text-foreground">Kimlik Numarası <span className="text-destructive">*</span></Label>
                <Input id="identity_number" required value={newParticipantData.identity_number} onChange={(e) => setNewParticipantData({ ...newParticipantData, identity_number: e.target.value })} placeholder="TC / Pasaport no" />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="nationality" className="text-foreground">Uyruk <span className="text-destructive">*</span></Label>
                <CountrySearchSelect
                  value={newParticipantData.nationality}
                  onChange={(val) => setNewParticipantData({ ...newParticipantData, nationality: val })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date_of_birth" className="text-foreground">Doğum Tarihi <span className="text-destructive">*</span></Label>
                <Input id="date_of_birth" type="date" required value={newParticipantData.date_of_birth} onChange={(e) => setNewParticipantData({ ...newParticipantData, date_of_birth: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-foreground">Cinsiyet</Label>
                <Select value={newParticipantData.gender} onValueChange={(val) => setNewParticipantData({ ...newParticipantData, gender: val })}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Cinsiyet seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="blood_type" className="text-foreground">Kan Grubu</Label>
                <Select value={newParticipantData.blood_type} onValueChange={(val) => setNewParticipantData({ ...newParticipantData, blood_type: val })}>
                  <SelectTrigger id="blood_type">
                    <SelectValue placeholder="Kan grubu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t_shirt_size" className="text-foreground">Tişört Beden</Label>
                <Select value={newParticipantData.t_shirt_size} onValueChange={(val) => setNewParticipantData({ ...newParticipantData, t_shirt_size: val })}>
                  <SelectTrigger id="t_shirt_size">
                    <SelectValue placeholder="Tişört bedeni seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '3xl'].map(size => (
                      <SelectItem key={size} value={size}>{size.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="club_name" className="text-foreground">Kulüp Adı</Label>
                <Input id="club_name" value={newParticipantData.club_name} onChange={(e) => setNewParticipantData({ ...newParticipantData, club_name: e.target.value })} placeholder="Varsa spor kulübü adı" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="address" className="text-foreground">Adres <span className="text-destructive">*</span></Label>
                <textarea 
                  id="address" 
                  required 
                  value={newParticipantData.address} 
                  onChange={(e) => setNewParticipantData({ ...newParticipantData, address: e.target.value })} 
                  placeholder="Açık adres giriniz..."
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact" className="text-foreground">Acil Durum Kişisi <span className="text-destructive">*</span></Label>
                <Input id="emergency_contact" required value={newParticipantData.emergency_contact} onChange={(e) => setNewParticipantData({ ...newParticipantData, emergency_contact: e.target.value })} placeholder="Adı Soyadı" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emergency_phone_number" className="text-foreground">Acil Durum Telefonu <span className="text-destructive">*</span></Label>
                <Input id="emergency_phone_number" required value={newParticipantData.emergency_phone_number} onChange={(e) => setNewParticipantData({ ...newParticipantData, emergency_phone_number: e.target.value })} placeholder="Telefon Numarası" />
              </div>

              {/* Registration Specific Fields */}
              <div className="space-y-1.5">
                <Label htmlFor="bib_number" className="text-foreground">Göğüs Numarası (BİB)</Label>
                <Input 
                  id="bib_number" 
                  value={newParticipantData.bib_number} 
                  onChange={(e) => setNewParticipantData({ ...newParticipantData, bib_number: e.target.value })} 
                  placeholder="Boş bırakılırsa Kayıt ID'si kullanılır" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-foreground">Ödeme Durumu</Label>
                  <Select value={newParticipantData.status} onValueChange={(val) => setNewParticipantData({ ...newParticipantData, status: val })}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Ödeme Durumu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="paid">Ödendi</SelectItem>
                      <SelectItem value="refunded">İade Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="certificate_status" className="text-foreground">Sağlık Belgesi</Label>
                  <Select value={newParticipantData.certificate_status} onValueChange={(val) => setNewParticipantData({ ...newParticipantData, certificate_status: val })}>
                    <SelectTrigger id="certificate_status">
                      <SelectValue placeholder="Sağlık Belgesi durumu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="approved">Onaylandı</SelectItem>
                      <SelectItem value="rejected">Reddedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>İptal</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Kaydediliyor...' : selectedRegistration ? 'Kaydet' : 'Katılımcı Oluştur'}
              </Button>
            </div>
          </form>
        </div>
      </RightDrawer>

      {/* Pending Approvals Drawer */}
      <RightDrawer open={pendingDrawerOpen} onOpenChange={setPendingDrawerOpen} title={`Ödeme Onayı Bekleyen Kayıtlar (${pendingCount})`}>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="space-y-4 p-5">
            {(pendingData?.data || []).map((reg) => (
              <Card key={reg.id} className="p-4 border border-border bg-card shadow-xs">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm capitalize text-foreground">
                      {reg.participant?.name || 'Bilinmiyor'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {reg.race?.name || '-'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {reg.bib_number && (
                        <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 bg-muted/50">
                          #{reg.bib_number}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/20 text-amber-600 bg-amber-500/5">
                        Beklemede
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApprovePending(reg)}
                    className="h-8 font-semibold text-xs rounded-md shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Ödemeyi Onayla
                  </Button>
                </div>
              </Card>
            ))}
            {(!pendingData?.data || pendingData.data.length === 0) && (
              <div className="text-center py-12 text-muted-foreground/60 text-xs italic">
                Onay bekleyen kayıt bulunmamaktadır.
              </div>
            )}
          </div>
        </ScrollArea>
      </RightDrawer>

      {/* Export Settings Drawer */}
      <RightDrawer 
        open={exportDrawerOpen} 
        onOpenChange={setExportDrawerOpen} 
        title="Dışa Aktarma Ayarları"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setExportDrawerOpen(false)} disabled={isExporting}>
              Vazgeç
            </Button>
            <Button onClick={handleExecuteExport} disabled={isExporting} className="bg-primary text-primary-foreground hover:bg-primary/95">
              {isExporting ? 'Aktarılıyor...' : 'Dışa Aktar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1 text-foreground">
              Dışa Aktarma Türü <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={exportType} onValueChange={setExportType} className="space-y-2">
              <div 
                onClick={() => setExportType('all')} 
                className={`flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/10 cursor-pointer transition-colors ${exportType === 'all' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
              >
                <RadioGroupItem value="all" id="r-all" className="mt-1" />
                <Label htmlFor="r-all" className="flex-1 font-medium cursor-pointer text-foreground text-xs leading-normal">
                  Tüm Kayıtlar
                  <span className="text-[11px] text-muted-foreground block font-normal mt-0.5 leading-relaxed">
                    Her kayıt (bilet) ayrı satır halinde listelenir. Çoklu katılım sağlayan sporcular birden fazla kez listelenir.
                  </span>
                </Label>
              </div>
              <div 
                onClick={() => setExportType('unique_participants')} 
                className={`flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/10 cursor-pointer transition-colors ${exportType === 'unique_participants' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
              >
                <RadioGroupItem value="unique_participants" id="r-unique" className="mt-1" />
                <Label htmlFor="r-unique" className="flex-1 font-medium cursor-pointer text-foreground text-xs leading-normal">
                  Benzersiz Katılımcılar
                  <span className="text-[11px] text-muted-foreground block font-normal mt-0.5 leading-relaxed">
                    Mükerrerlik engellenir. Her sporcu için tek bir satır listelenir (katıldığı en son kayıt bilgisiyle).
                  </span>
                </Label>
              </div>
              <div 
                onClick={() => setExportType('combined_summary')} 
                className={`flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/10 cursor-pointer transition-colors ${exportType === 'combined_summary' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
              >
                <RadioGroupItem value="combined_summary" id="r-combined" className="mt-1" />
                <Label htmlFor="r-combined" className="flex-1 font-medium cursor-pointer text-foreground text-xs leading-normal">
                  Katılımcı + Yarış Özeti (Birleşik)
                  <span className="text-[11px] text-muted-foreground block font-normal mt-0.5 leading-relaxed">
                    Katılımcı bilgileri tek satırda kalır, katıldığı tüm yarışlar ve göğüs numaraları virgülle ayrılmış şekilde tek hücrede birleştirilir.
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1 text-foreground">
              Dışa Aktarılacak Sütunları Seçin <span className="text-destructive">*</span>
            </Label>
            <div className="rounded-lg border border-border p-4 bg-card space-y-4">
              <div className="flex items-center space-x-2 border-b border-border pb-3">
                <Checkbox 
                  id="select-all-cols" 
                  checked={isAllColumnsSelected} 
                  onCheckedChange={handleToggleAllColumns} 
                />
                <Label htmlFor="select-all-cols" className="font-semibold text-sm cursor-pointer text-foreground">
                  Tümünü Seç / Kaldır
                </Label>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-bib_number" 
                    checked={exportColumns.bib_number} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, bib_number: !!checked }))} 
                  />
                  <Label htmlFor="col-bib_number" className="text-xs font-semibold cursor-pointer text-foreground">Bib Numarası</Label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-race_name" 
                    checked={exportColumns.race_name} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, race_name: !!checked }))} 
                  />
                  <Label htmlFor="col-race_name" className="text-xs font-semibold cursor-pointer text-foreground">Yarış</Label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-name" 
                    checked={exportColumns.name} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, name: !!checked }))} 
                  />
                  <Label htmlFor="col-name" className="text-xs font-semibold cursor-pointer text-foreground">Adı & Soyadı</Label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-identity_number" 
                    checked={exportColumns.identity_number} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, identity_number: !!checked }))} 
                  />
                  <Label htmlFor="col-identity_number" className="text-xs font-semibold cursor-pointer text-foreground">T.C. / Pasaport No</Label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-dob" 
                    checked={exportColumns.dob} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, dob: !!checked }))} 
                  />
                  <Label htmlFor="col-dob" className="text-xs font-semibold cursor-pointer text-foreground">Doğum Yılı</Label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-contest" 
                    checked={exportColumns.contest} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, contest: !!checked }))} 
                  />
                  <Label htmlFor="col-contest" className="text-xs font-semibold cursor-pointer text-foreground">Contest</Label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-club" 
                    checked={exportColumns.club} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, club: !!checked }))} 
                  />
                  <Label htmlFor="col-club" className="text-xs font-semibold cursor-pointer text-foreground">Kulüp</Label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-phone" 
                    checked={exportColumns.phone} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, phone: !!checked }))} 
                  />
                  <Label htmlFor="col-phone" className="text-xs font-semibold cursor-pointer text-foreground">Telefon</Label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-gender" 
                    checked={exportColumns.gender} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, gender: !!checked }))} 
                  />
                  <Label htmlFor="col-gender" className="text-xs font-semibold cursor-pointer text-foreground">Cinsiyet</Label>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Checkbox 
                    id="col-nationality" 
                    checked={exportColumns.nationality} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, nationality: !!checked }))} 
                  />
                  <Label htmlFor="col-nationality" className="text-xs font-semibold cursor-pointer text-foreground">Uyruk</Label>
                </div>
                <div className="flex items-center space-x-2.5 col-span-2">
                  <Checkbox 
                    id="col-t_shirt" 
                    checked={exportColumns.t_shirt} 
                    onCheckedChange={(checked) => setExportColumns(p => ({ ...p, t_shirt: !!checked }))} 
                  />
                  <Label htmlFor="col-t_shirt" className="text-xs font-semibold cursor-pointer text-foreground">T-Shirt Bedeni</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 text-primary dark:text-primary-foreground/90 rounded-lg p-3.5 text-xs flex items-center justify-between font-semibold">
            <span>Seçili Sütun Sayısı:</span>
            <Badge className="bg-primary hover:bg-primary/95 text-primary-foreground font-mono text-xs px-2.5 py-0.5">
              {selectedColumnsCount} Sütun
            </Badge>
          </div>
        </div>
      </RightDrawer>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kayıt kaydını silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Sporcunun yarışa olan bu bilet kaydı veri tabanından tamamen kaldırılacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(idToDelete)} className="bg-red-600 hover:bg-red-700 text-white">
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
