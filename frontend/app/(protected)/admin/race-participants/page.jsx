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
  Users,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export default function ParticipantsPage() {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setApiSearchQuery(searchQuery);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Drawer / Form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [formData, setFormData] = useState({
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
  });

  // Delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // Fetch Participants
  const { data, isLoading } = useQuery({
    queryKey: ['admin-participants', pagination, sorting, apiSearchQuery],
    queryFn: async () => {
      const sortField = sorting?.[0]?.id || 'id';
      const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        per_page: String(pagination.pageSize),
        sort: sortField,
        dir: sortDirection,
        ...(apiSearchQuery ? { search: apiSearchQuery } : {}),
      });

      const res = await apiFetch(`/api/admin/race-participants?${params.toString()}`);
      if (!res.ok) throw new Error('Katılımcılar yüklenemedi');
      return res.json();
    },
  });

  // Fetch Races
  const { data: racesData } = useQuery({
    queryKey: ['admin-races-list'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/races?per_page=1000');
      if (!res.ok) throw new Error('Yarışlar yüklenemedi');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch Users
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const res = await apiFetch('/api/user-management/users/select');
      if (!res.ok) throw new Error('Kullanıcılar yüklenemedi');
      const json = await res.json();
      return json || [];
    },
  });

  // Create or Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const isEdit = !!selectedParticipant;
      const url = isEdit 
        ? `/api/admin/race-participants/${selectedParticipant.id}`
        : '/api/admin/race-participants';
      
      const res = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'İşlem başarısız oldu');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-participants'] });
      toast.success(selectedParticipant ? 'Katılımcı güncellendi' : 'Katılımcı oluşturuldu');
      setDrawerOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Bir hata oluştu');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/race-participants/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Katılımcı silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-participants'] });
      toast.success('Katılımcı silindi');
      setDeleteConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Silme işlemi başarısız');
    },
  });

  const handleEditClick = (participant) => {
    setSelectedParticipant(participant);
    setFormData({
      user_id: String(participant.user_id || ''),
      race_id: '',
      name: participant.name || '',
      identity_number: participant.identity_number || '',
      phone_number: participant.phone_number || '',
      date_of_birth: participant.date_of_birth || '',
      gender: participant.gender || 'male',
      blood_type: normalizeBloodType(participant.blood_type),
      t_shirt_size: normalizeTShirtSize(participant.t_shirt_size),
      club_name: participant.club_name || '',
      nationality: normalizeNationality(participant.nationality),
      emergency_contact: participant.emergency_contact || '',
      emergency_phone_number: participant.emergency_phone_number || '',
      address: participant.address || '',
    });
    setDrawerOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedParticipant(null);
    setFormData({
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
    });
    setDrawerOpen(true);
  };

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      user_id: Number(formData.user_id),
      ...(formData.race_id ? { race_id: Number(formData.race_id) } : {}),
    };
    saveMutation.mutate(payload);
  };

  // Columns definition
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      id: 'name',
      header: ({ column }) => (
        <DataGridColumnHeader title="Ad Soyad" column={column} visibility />
      ),
      cell: ({ row }) => (
        <div className="font-semibold text-foreground">{row.original.name}</div>
      ),
      meta: { skeleton: <Skeleton className="w-32 h-6" /> },
    },
    {
      accessorKey: 'identity_number',
      id: 'identity_number',
      header: "TC / Pasaport No",
      cell: ({ row }) => row.original.identity_number || '-',
      meta: { skeleton: <Skeleton className="w-24 h-6" /> },
    },
    {
      accessorKey: 'phone_number',
      id: 'phone_number',
      header: "Telefon",
      cell: ({ row }) => row.original.phone_number || '-',
      meta: { skeleton: <Skeleton className="w-24 h-6" /> },
    },
    {
      accessorKey: 'email',
      id: 'email',
      header: "E-Posta",
      cell: ({ row }) => row.original.email || '-',
      meta: { skeleton: <Skeleton className="w-36 h-6" /> },
    },
    {
      accessorKey: 't_shirt_size',
      id: 't_shirt_size',
      header: "Tişört Bedeni",
      cell: ({ row }) => row.original.t_shirt_size ? <Badge variant="outline">{row.original.t_shirt_size.toUpperCase()}</Badge> : '-',
      meta: { skeleton: <Skeleton className="w-12 h-6" /> },
    },
    {
      accessorKey: 'blood_type',
      id: 'blood_type',
      header: "Kan Grubu",
      cell: ({ row }) => row.original.blood_type || '-',
      meta: { skeleton: <Skeleton className="w-12 h-6" /> },
    },
    {
      id: 'races',
      header: "Yarışlar",
      cell: ({ row }) => {
        const registrations = row.original.registrations || [];
        if (registrations.length === 0) return '-';
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {registrations.map((reg) => (
              <Badge key={reg.id} variant="secondary" className="whitespace-nowrap">
                {reg.race?.title?.tr || reg.race?.title?.en || 'Bilinmeyen Yarış'}
              </Badge>
            ))}
          </div>
        );
      },
      meta: { skeleton: <Skeleton className="w-24 h-6" /> },
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
      meta: { skeleton: <Skeleton className="size-8" /> },
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
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Katılımcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 w-full md:w-64"
            />
            {searchQuery && (
              <Button variant="ghost" className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => { setSearchQuery(''); }}>
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
        <Button onClick={handleCreateClick} className="gap-1.5 font-semibold text-xs h-9 rounded-lg">
          <Plus className="size-4" /> Katılımcı Ekle
        </Button>
      </CardHeader>
    );
  };

  return (
    <Container className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Ana Sayfa</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Katılımcılar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Katılımcı Yönetimi</h1>
        <p className="text-xs md:text-sm text-muted-foreground/80">
          Yarışlara katılan tüm sporcuların profillerini buradan listeleyebilir, düzenleyebilir veya yeni kayıt oluşturabilirsiniz.
        </p>
      </div>

      <DataGrid
        table={table}
        recordCount={data?.meta?.total || 0}
        isLoading={isLoading}
        tableLayout={{ columnsResizable: true }}
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

      {/* Editor Drawer */}
      <RightDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selectedParticipant ? 'Katılımcı Düzenle' : 'Yeni Katılımcı Ekle'} size="2xl">
        <form onSubmit={handleFormSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Row 1 */}
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="user_id" className="text-foreground">Kullanıcı Seç <span className="text-destructive">*</span></Label>
              <UserSearchSelect
                value={formData.user_id}
                onChange={(val) => setFormData({ ...formData, user_id: val })}
                users={usersData || []}
                selectedUserProp={selectedParticipant?.user}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="race_id" className="text-foreground">Yarış Seç {!selectedParticipant && <span className="text-destructive">*</span>}</Label>
              <Select value={formData.race_id} onValueChange={(val) => setFormData({ ...formData, race_id: val })} disabled={!!selectedParticipant}>
                <SelectTrigger id="race_id">
                  <SelectValue placeholder={selectedParticipant ? 'Düzenlemede değiştirilemez' : 'Yarış seçin'} />
                </SelectTrigger>
                <SelectContent>
                  {(racesData || []).map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2 */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-foreground">Ad Soyad <span className="text-destructive">*</span></Label>
              <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ad soyad giriniz" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone_number" className="text-foreground">Telefon Numarası <span className="text-destructive">*</span></Label>
              <Input id="phone_number" required value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} placeholder="Telefon numarası" />
            </div>

            {/* Row 3 */}
            <div className="space-y-1.5">
              <Label htmlFor="identity_number" className="text-foreground">Kimlik Numarası <span className="text-destructive">*</span></Label>
              <Input id="identity_number" required value={formData.identity_number} onChange={(e) => setFormData({ ...formData, identity_number: e.target.value })} placeholder="TC / Pasaport no" />
            </div>

            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="nationality" className="text-foreground">Uyruk <span className="text-destructive">*</span></Label>
              <CountrySearchSelect
                value={formData.nationality}
                onChange={(val) => setFormData({ ...formData, nationality: val })}
              />
            </div>

            {/* Row 4 */}
            <div className="space-y-1.5">
              <Label htmlFor="date_of_birth" className="text-foreground">Doğum Tarihi <span className="text-destructive">*</span></Label>
              <Input id="date_of_birth" type="date" required value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-foreground">Cinsiyet</Label>
              <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
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

            {/* Row 5 */}
            <div className="space-y-1.5">
              <Label htmlFor="blood_type" className="text-foreground">Kan Grubu</Label>
              <Select value={formData.blood_type} onValueChange={(val) => setFormData({ ...formData, blood_type: val })}>
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
              <Select value={formData.t_shirt_size} onValueChange={(val) => setFormData({ ...formData, t_shirt_size: val })}>
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

            {/* Row 6 */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="club_name" className="text-foreground">Kulüp Adı</Label>
              <Input id="club_name" value={formData.club_name} onChange={(e) => setFormData({ ...formData, club_name: e.target.value })} placeholder="Varsa spor kulübü adı" />
            </div>

            {/* Row 7 */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address" className="text-foreground">Adres <span className="text-destructive">*</span></Label>
              <textarea 
                id="address" 
                required 
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                placeholder="Açık adres giriniz..."
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Row 8 */}
            <div className="space-y-1.5">
              <Label htmlFor="emergency_contact" className="text-foreground">Acil Durum Kişisi <span className="text-destructive">*</span></Label>
              <Input id="emergency_contact" required value={formData.emergency_contact} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} placeholder="Adı Soyadı (Örn: Yakını)" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emergency_phone_number" className="text-foreground">Acil Durum Telefonu <span className="text-destructive">*</span></Label>
              <Input id="emergency_phone_number" required value={formData.emergency_phone_number} onChange={(e) => setFormData({ ...formData, emergency_phone_number: e.target.value })} placeholder="Telefon Numarası" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>İptal</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Kaydediliyor...' : (selectedParticipant ? 'Kaydet' : 'Katılımcı Oluştur')}
            </Button>
          </div>
        </form>
      </RightDrawer>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Katılımcıyı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Sporcu kaydı silindiğinde, varsa bağlı yarış kayıtları da etkilenebilir.
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
