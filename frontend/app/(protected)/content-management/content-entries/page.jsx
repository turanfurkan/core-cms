'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Edit,
  Trash,
  Plus,
  Search,
  X,
  Globe,
  LoaderCircleIcon,
  Grid,
  MonitorPlay,
  FileText,
  Library,
  Megaphone,
  BarChart3,
  HelpCircle,
  Cpu,
  Layers,
  MessageSquare,
  CalendarRange,
  Ticket,
  Users2,
  TrendingUp,
  CreditCard,
  MousePointerClick,
  Play,
  Newspaper,
  Mail,
  ListOrdered,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import ContentEntryDialog from './components/content-entry-dialog';
import ContentEntryForm from './components/content-entry-form';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
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
import { RightDrawer } from '@/components/common/right-drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const getLocalizedValue = (value, currentLang = 'tr') => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value[currentLang] || value['tr'] || value['en'] || Object.values(value)[0] || '';
  }
  return String(value);
};

const fallbackVariations = [
  {
    id: 'standard_layout',
    name: 'Standart Yerleşim',
    description: 'Bloğun klasik dikey yerleşimi.',
    wireframe: (
      <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5">
        <div className="w-1/3 h-2.5 bg-slate-200 rounded"></div>
        <div className="w-full h-1.5 bg-slate-150 rounded"></div>
        <div className="w-5/6 h-1.5 bg-slate-150 rounded"></div>
      </div>
    )
  },
  {
    id: 'split_layout',
    name: 'İki Sütunlu Ayrılmış Düzen',
    description: 'Sol tarafta görsel/medya, sağ tarafta içerik yerleşimi.',
    wireframe: (
      <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-2 gap-3 items-center">
        <div className="w-full h-8 bg-slate-200 rounded"></div>
        <div className="space-y-1">
          <div className="w-3/4 h-2 bg-slate-150 rounded"></div>
          <div className="w-full h-1 bg-slate-100 rounded"></div>
        </div>
      </div>
    )
  },
  {
    id: 'compact_grid',
    name: 'Sıkıştırılmış Izgara Yerleşimi',
    description: 'İçeriği daha dar ve sıkışık bir ızgarada listeler.',
    wireframe: (
      <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-2 gap-2">
        {[1, 2].map(i => (
          <div key={i} className="bg-white border border-slate-150 rounded p-1.5 space-y-1">
            <div className="w-1/2 h-1.5 bg-slate-200 rounded"></div>
            <div className="w-full h-1 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    )
  }
];

const blockVariations = {
  hero_banner: [
    {
      id: 'minimal_centered',
      name: 'Minimal Ortalanmış Giriş',
      description: 'Sadece yazı ve buton içerir.',
      wireframe: (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col items-center gap-1.5">
          <div className="w-2/3 h-2 bg-slate-200 rounded"></div>
          <div className="w-1/2 h-1.5 bg-slate-150 rounded"></div>
          <div className="w-12 h-3 bg-primary/20 rounded mt-1"></div>
        </div>
      )
    },
    {
      id: 'image_supported',
      name: 'Görsel Destekli Giriş',
      description: 'Solda yazı, sağda görsel önizlemesi içerir.',
      wireframe: (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-2 gap-3 items-center">
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-slate-200 rounded"></div>
            <div className="w-3/4 h-1.5 bg-slate-150 rounded"></div>
            <div className="w-10 h-3 bg-primary/20 rounded"></div>
          </div>
          <div className="w-full h-10 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400">🖼️</div>
        </div>
      )
    },
    {
      id: 'form_input',
      name: 'Formlu Giriş',
      description: 'Sol tarafta başlık, sağ tarafta bülten/kayıt formu içerir.',
      wireframe: (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-2 gap-3 items-center">
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-slate-200 rounded"></div>
            <div className="w-1/2 h-1.5 bg-slate-150 rounded"></div>
          </div>
          <div className="w-full bg-white border border-slate-200 rounded p-1.5 space-y-1">
            <div className="w-full h-2 bg-slate-100 rounded"></div>
            <div className="w-full h-3.5 bg-primary/30 rounded"></div>
          </div>
        </div>
      )
    }
  ],
  rich_text: [
    {
      id: 'standard_centered',
      name: 'Ortalanmış Zengin Metin',
      description: 'Ortalanmış başlık ve paragraf düzeni.',
      wireframe: (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col items-center gap-1.5">
          <div className="w-1/2 h-2.5 bg-slate-200 rounded"></div>
          <div className="w-full h-1.5 bg-slate-150 rounded"></div>
          <div className="w-5/6 h-1.5 bg-slate-150 rounded"></div>
        </div>
      )
    },
    {
      id: 'two_columns',
      name: 'İki Sütunlu Metin Düzeni',
      description: 'Yan yana iki sütundan oluşan uzun metin yerleşimi.',
      wireframe: (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-slate-150 rounded"></div>
            <div className="w-5/6 h-1.5 bg-slate-150 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-slate-150 rounded"></div>
            <div className="w-5/6 h-1.5 bg-slate-150 rounded"></div>
          </div>
        </div>
      )
    },
    {
      id: 'callout_highlight',
      name: 'Öne Çıkarılmış Alıntı',
      description: 'Vurgulanmış kenar çizgili alıntı ve açıklama kartı.',
      wireframe: (
        <div className="w-full bg-slate-50 border border-slate-100 border-l-2 border-l-primary rounded-r-lg p-3 space-y-1">
          <div className="w-3/4 h-2 bg-slate-200 rounded"></div>
          <div className="w-full h-1.5 bg-slate-150 rounded"></div>
        </div>
      )
    }
  ],
  collection_display: [
    {
      id: 'grid_cards',
      name: '3 Kolonlu Kart Izgarası',
      description: 'Görselli içerikleri 3 kolonlu ızgara şeklinde listeler.',
      wireframe: (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-150 rounded p-1 space-y-1">
              <div className="w-full h-5 bg-slate-100 rounded"></div>
              <div className="w-3/4 h-1 bg-slate-250 rounded"></div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'list_items',
      name: 'Detaylı Liste Düzeni',
      description: 'Alt alta sıralanmış resimli liste elemanları.',
      wireframe: (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-2 items-center bg-white border border-slate-150 rounded p-1">
              <div className="w-6 h-6 bg-slate-100 rounded shrink-0"></div>
              <div className="flex-1 space-y-1">
                <div className="w-1/2 h-1.5 bg-slate-200 rounded"></div>
                <div className="w-3/4 h-1 bg-slate-150 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'carousel_slider',
      name: 'Yatay Kaydırıcı (Slider)',
      description: 'Kartları yana kaydırılabilir carousel şeklinde listeler.',
      wireframe: (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 flex gap-2 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-150 rounded p-1 w-20 shrink-0 space-y-1">
              <div className="w-full h-4 bg-slate-100 rounded"></div>
              <div className="w-3/4 h-1 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      )
    }
  ]
};

export default function ContentEntriesPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const [selectedTypeId, setSelectedTypeId] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [blockDeleteConfirmOpen, setBlockDeleteConfirmOpen] = useState(false);
  const [blockToDeleteId, setBlockToDeleteId] = useState(null);
  const [addBlockDrawerOpen, setAddBlockDrawerOpen] = useState(false);
  const [blockSearchQuery, setBlockSearchQuery] = useState('');
  const [selectedBlockForVariant, setSelectedBlockForVariant] = useState(null);

  const readyBlocks = useMemo(() => [
    { id: 'hero_banner', name: 'Hero Giriş', type: 'hero_banner', icon: MonitorPlay, description: 'Giriş Görseli (Hero Banner)' },
    { id: 'rich_text', name: 'Zengin Metin', type: 'rich_text', icon: FileText, description: 'Zengin Metin Alanı (Rich Text)' },
    { id: 'collection_display', name: 'Koleksiyon Listeleme', type: 'collection_display', icon: Library, description: 'Koleksiyon Listeleme' },
    { id: 'entry_callout', name: 'Callout Paneli', type: 'entry_callout', icon: Megaphone, description: 'Görsel Callout Paneli' },
    { id: 'statistics_block', name: 'İstatistikler', type: 'statistics_block', icon: BarChart3, description: 'İstatistik Sayacı Izgarası' },
    { id: 'faq_accordion', name: 'SSS', type: 'faq_accordion', icon: HelpCircle, description: 'Sıkça Sorulan Sorular' },
    { id: 'features_grid', name: 'Özellikler', type: 'features_grid', icon: Cpu, description: 'Özellik Izgarası' },
    { id: 'integrations_logos', name: 'Logolar', type: 'integrations_logos', icon: Layers, description: 'Entegrasyon Logoları' },
    { id: 'testimonial_card', name: 'Müşteri Yorumları', type: 'testimonial_card', icon: MessageSquare, description: 'Müşteri Değerlendirmeleri' },
    { id: 'timeline_milestones', name: 'Zaman Çizelgesi', type: 'timeline_milestones', icon: CalendarRange, description: 'Zaman Çizelgesi' },
    { id: 'event_banner', name: 'Etkinlik', type: 'event_banner', icon: Ticket, description: 'Etkinlik & Webinar Duyurusu' },
    { id: 'team_grid', name: 'Ekibimiz', type: 'team_grid', icon: Users2, description: 'Ekip Üyeleri Izgarası' },
    { id: 'campaign_banner', name: 'Kampanya', type: 'campaign_banner', icon: TrendingUp, description: 'Kampanya & Promosyon Kartı' },
    { id: 'pricing_block', name: 'Fiyatlandırma Tablosu', type: 'pricing_block', icon: CreditCard, description: 'Fiyat ve Paket Seçenekleri' },
    { id: 'cta_block', name: 'Aksiyon Çağrısı (CTA)', type: 'cta_block', icon: MousePointerClick, description: 'Dönüşüm Odaklı Buton ve Banner' },
    { id: 'video_block', name: 'Video Tanıtım', type: 'video_block', icon: Play, description: 'Medya ve Video Oynatıcı Alanı' },
    { id: 'blog_posts', name: 'Son Yazılar / Blog', type: 'blog_posts', icon: Newspaper, description: 'Dinamik İçerik ve Haber Listesi' },
    { id: 'newsletter_subscribe', name: 'Bülten Aboneliği', type: 'newsletter_subscribe', icon: Mail, description: 'E-Posta Toplama Formu' },
    { id: 'steps_timeline', name: 'Nasıl Çalışır? (Steps)', type: 'steps_timeline', icon: ListOrdered, description: 'Adım Adım Süreç Akışı' },
    { id: 'google_maps', name: 'Harita', type: 'google_maps', icon: MapPin, description: 'Lokasyon ve Harita Entegrasyonu' }
  ], []);

  const filteredReadyBlocks = useMemo(() => {
    if (!blockSearchQuery) return readyBlocks;
    const q = blockSearchQuery.toLowerCase();
    return readyBlocks.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  }, [blockSearchQuery, readyBlocks]);

  // Fetch all content types for dropdown selector
  const { data: contentTypes } = useQuery({
    queryKey: ['admin-content-types'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/content-types');
      if (!res.ok) throw new Error('Failed to fetch content types');
      const json = await res.json();
      return json.data || [];
    },
  });

  useEffect(() => {
    if (typeParam && contentTypes) {
      const foundType = contentTypes.find(
        (t) => String(t.id) === typeParam || t.slug === typeParam
      );
      if (foundType) {
        setSelectedTypeId(String(foundType.id));
      }
    }
  }, [typeParam, contentTypes]);



  const activeType = useMemo(() => {
    return contentTypes?.find((t) => String(t.id) === selectedTypeId);
  }, [contentTypes, selectedTypeId]);

  // Fetch entries for active content type
  const { data: entries, isLoading } = useQuery({
    queryKey: ['admin-content-entries', selectedTypeId],
    queryFn: async () => {
      if (selectedTypeId === 'all') return [];
      const res = await apiFetch(`/api/admin/content-types/${selectedTypeId}/entries`);
      if (!res.ok) throw new Error('Failed to fetch entries');
      const json = await res.json();
      return json.data || [];
    },
    enabled: selectedTypeId !== 'all',
  });

  const [localBlocks, setLocalBlocks] = useState([]);

  useEffect(() => {
    const singleTypeEntry = entries?.[0] || null;
    const dynamicZoneField = activeType?.fields?.find(f => f.type === 'dynamic_zone');
    const blocksVal = dynamicZoneField ? (singleTypeEntry?.data?.[dynamicZoneField.slug] || []) : [];
    setLocalBlocks(blocksVal);
  }, [entries, activeType]);

  // Filter local entries based on search input
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (!searchQuery) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter((item) => {
      const title = getLocalizedValue(item.data?.title || item.title, i18n.language);
      const slug = getLocalizedValue(item.data?.slug || item.slug, i18n.language);
      return (
        title.toLowerCase().includes(query) ||
        slug.toLowerCase().includes(query) ||
        String(item.id).includes(query)
      );
    });
  }, [entries, searchQuery, i18n.language]);

  // Delete Entry Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/content-types/${selectedTypeId}/entries/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(t('content_entries.messages.error_delete', 'Failed to delete content.'));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-entries', selectedTypeId] });
      setDeleteConfirmOpen(false);
      setIdToDelete(null);
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{t('content_entries.messages.success_delete', 'İçerik başarıyla silindi.')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || t('content_entries.messages.error_fallback', 'İşlem başarısız.')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  // Publish / Unpublish Entry Mutation
  const publishMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await apiFetch(`/api/admin/content-types/${selectedTypeId}/entries/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(t('content_entries.messages.error_fallback', 'Failed to update status'));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-entries', selectedTypeId] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{t('content_entries.messages.success_publish_toggle', 'İçerik yayın durumu güncellendi.')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || t('content_entries.messages.error_fallback', 'İşlem başarısız.')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const updateBlocksMutation = useMutation({
    mutationFn: async ({ entryId, payload }) => {
      const res = await apiFetch(`/api/admin/content-types/${selectedTypeId}/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Güncelleme başarısız.');
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-entries', selectedTypeId] });
      toast.success(variables.successMessage || 'Bölüm sıralaması başarıyla güncellendi.');
    },
    onError: (err) => {
      toast.error(err.message || 'İşlem gerçekleştirilirken bir hata oluştu.');
    }
  });

  const handleEdit = (entry, e) => {
    e.stopPropagation();
    setSelectedEntry(entry);
    setDialogOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (idToDelete) {
      deleteMutation.mutate(idToDelete);
    }
  };

  const confirmDeleteBlock = () => {
    if (blockToDeleteId && activeType) {
      const singleTypeEntry = entries?.[0] || null;
      const dynamicZoneField = activeType?.fields?.find(f => f.type === 'dynamic_zone');
      if (!singleTypeEntry || !dynamicZoneField) return;

      const newBlocks = localBlocks.filter(b => b.id !== blockToDeleteId);
      setLocalBlocks(newBlocks);
      const updatedData = {
        ...singleTypeEntry.data,
        [dynamicZoneField.slug]: newBlocks
      };

      updateBlocksMutation.mutate({
        entryId: singleTypeEntry.id,
        payload: {
          data: updatedData,
          status: singleTypeEntry.status || 'published'
        },
        successMessage: 'Bölüm başarıyla silindi.'
      }, {
        onSuccess: () => {
          setBlockDeleteConfirmOpen(false);
          setBlockToDeleteId(null);
        }
      });
    }
  };

  const handleAddBlock = (blockType, variantId) => {
    if (activeType) {
      const singleTypeEntry = entries?.[0] || null;
      const dynamicZoneField = activeType?.fields?.find(f => f.type === 'dynamic_zone');
      if (!singleTypeEntry || !dynamicZoneField) return;

      const newBlockId = `${blockType}_${Date.now()}`;
      const newBlock = {
        id: newBlockId,
        type: blockType,
        variant: variantId,
        title: { tr: '', en: '' },
        data: {}
      };

      const newBlocks = [...localBlocks, newBlock];
      setLocalBlocks(newBlocks);

      const updatedData = {
        ...singleTypeEntry.data,
        [dynamicZoneField.slug]: newBlocks
      };

      updateBlocksMutation.mutate({
        entryId: singleTypeEntry.id,
        payload: {
          data: updatedData,
          status: singleTypeEntry.status || 'published'
        },
        successMessage: 'Yeni bölüm başarıyla eklendi.'
      }, {
        onSuccess: () => {
          setAddBlockDrawerOpen(false);
          setSelectedBlockForVariant(null);
        }
      });
    }
  };

  const handleTogglePublish = (entry, e) => {
    e.stopPropagation();
    const newStatus = entry.status === 'published' ? 'draft' : 'published';
    publishMutation.mutate({ id: entry.id, status: newStatus });
  };

  const columns = useMemo(
    () => {
      const baseCols = [
        {
          accessorKey: 'id',
          id: 'id',
          header: ({ column }) => (
            <DataGridColumnHeader title={t('content_entries.columns.id', 'ID')} visibility={true} column={column} />
          ),
          cell: ({ row }) => <span className="text-xs text-muted-foreground font-mono">{row.original.id}</span>,
          size: 60,
        },
        {
          accessorKey: 'title',
          id: 'title',
          header: ({ column }) => (
            <DataGridColumnHeader title={t('content_entries.columns.title', 'Başlık')} visibility={true} column={column} />
          ),
          cell: ({ row }) => {
            const data = row.original.data || {};
            const title = getLocalizedValue(data.title || row.original.title, i18n.language) || 'Untitled';
            const slug = getLocalizedValue(data.slug || row.original.slug, i18n.language);
            return (
              <div className="space-y-0.5">
                <div className="font-semibold text-sm">{title}</div>
                {slug && <code className="text-[10px] text-muted-foreground font-mono">/{slug}</code>}
              </div>
            );
          },
          size: 250,
        },
      ];

      // Add Erişim & Fiyat column if monetization is enabled
      if (activeType?.settings?.monetization?.enabled) {
        baseCols.push({
          id: 'access_control',
          header: ({ column }) => (
            <DataGridColumnHeader title={t('content_entries.columns.access_price', 'Erişim & Fiyat')} visibility={true} column={column} />
          ),
          cell: ({ row }) => {
            const data = row.original.data || {};
            const accessType = data.access_type || 'free';
            const price = data.price ?? 0;
            const currency = data.currency || 'TRY';

            if (accessType === 'free') {
              return <Badge variant="success" className="text-xs font-semibold">{t('content_entries.monetization.free', 'Ücretsiz')}</Badge>;
            } else if (accessType === 'protected') {
              return <Badge variant="info" className="text-xs font-semibold">{t('content_entries.monetization.members_only', 'Sadece Üye')}</Badge>;
            } else {
              return (
                <div className="flex items-center gap-1.5">
                  <Badge variant="warning" className="text-xs font-semibold">{t('content_entries.monetization.single_purchase_badge', 'Tekil Satış')}</Badge>
                  <span className="text-xs font-bold text-foreground">
                    {price} {currency}
                  </span>
                </div>
              );
            }
          },
          size: 150,
        });
      }

      baseCols.push(
        {
          accessorKey: 'status',
          id: 'status',
          header: ({ column }) => (
            <DataGridColumnHeader title={t('content_entries.columns.status', 'Durum')} visibility={true} column={column} />
          ),
          cell: ({ row }) => {
            const status = row.original.status;
            const isPublished = status === 'published';
            return (
              <Badge variant={isPublished ? 'success' : 'secondary'} className="text-xs">
                {isPublished ? t('content_entries.status.published', 'Yayında') : t('content_entries.status.draft', 'Taslak')}
              </Badge>
            );
          },
          size: 100,
        },
        {
          accessorKey: 'published_at',
          id: 'published_at',
          header: ({ column }) => (
            <DataGridColumnHeader title={t('content_entries.columns.published_at', 'Yayın Tarihi')} visibility={true} column={column} />
          ),
          cell: ({ row }) => {
            const date = row.original.published_at || row.original.created_at;
            return (
              <span className="text-xs text-muted-foreground">
                {date ? new Date(date).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US') : '-'}
              </span>
            );
          },
          size: 150,
        },
        {
          id: 'actions',
          header: '',
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <Button
                variant="dim"
                size="sm"
                onClick={(e) => handleEdit(row.original, e)}
                className="h-7 w-7 p-0"
                title={t('content_entries.tooltips.edit', 'Düzenle')}
              >
                <Edit className="size-3.5" />
              </Button>
              <Button
                variant="dim"
                size="sm"
                onClick={(e) => handleTogglePublish(row.original, e)}
                className="h-7 w-7 p-0"
                title={row.original.status === 'published' ? t('content_entries.tooltips.revert_draft', 'Taslağa Çek') : t('content_entries.tooltips.publish', 'Yayınla')}
                disabled={publishMutation.isPending}
              >
                <Globe className="size-3.5" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => handleDelete(row.original.id, e)}
                className="h-7 w-7 p-0"
                disabled={deleteMutation.isPending}
                title={t('content_entries.tooltips.delete', 'Sil')}
              >
                <Trash className="size-3.5" />
              </Button>
            </div>
          ),
          size: 120,
        }
      );

      return baseCols;
    },
    [deleteMutation.isPending, publishMutation.isPending, i18n.language, t, activeType]
  );

  const table = useReactTable({
    columns,
    data: filteredEntries,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
    };

    return (
      <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder={t('content_entries.search_placeholder', 'İçerik ara...')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
              className="ps-9 w-full sm:w-40 md:w-64"
            />
            {searchQuery.length > 0 && (
              <Button
                mode="icon"
                variant="dim"
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => {
                  setInputValue('');
                  setSearchQuery('');
                }}
              >
                <X />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button
            disabled={isLoading}
            onClick={() => {
              setSelectedEntry(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t('content_entries.add_new', 'Yeni İçerik Ekle')}
          </Button>
        </div>
      </CardHeader>
    );
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('content_entries.title', 'İçerik Yönetimi')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">{t('common.home', 'Home')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('common.content_management', 'Content Management')}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('content_entries.title', 'Content Entries')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="space-y-4">
        {/* Content Type Selector */}
        <Card className="p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-64 space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t('content_entries.select_template', 'Düzenlenecek İçerik Şablonu')}</span>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger>
                <SelectValue placeholder={t('content_entries.select_placeholder', 'Bir şablon seçin...')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('content_entries.select_option_none', 'Seçiniz...')}</SelectItem>
                {contentTypes?.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {selectedTypeId !== 'all' && activeType && (
          activeType.is_collection ? (
            <DataGrid
              table={table}
              recordCount={filteredEntries.length}
              isLoading={isLoading}
              tableClassNames={{ edgeCell: 'px-5' }}
            >
              <Card>
                <DataGridToolbar />
                <CardTable>
                  <ScrollArea>
                    <DataGridTable />
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardTable>
              </Card>
            </DataGrid>
          ) : (
            isLoading ? (
              <div className="flex justify-center items-center p-20 bg-white border border-slate-200 rounded-2xl">
                <LoaderCircleIcon className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              (() => {
                const singleTypeEntry = entries?.[0] || null;
                const dynamicZoneField = activeType?.fields?.find(f => f.type === 'dynamic_zone');
                const hasNoBlocks = localBlocks.length === 0;

                const handleReorder = (newBlocks) => {
                  setLocalBlocks(newBlocks);
                  if (!singleTypeEntry || !dynamicZoneField) return;
                  const updatedData = {
                    ...singleTypeEntry.data,
                    [dynamicZoneField.slug]: newBlocks
                  };
                  updateBlocksMutation.mutate({
                    entryId: singleTypeEntry.id,
                    payload: {
                      data: updatedData,
                      status: singleTypeEntry.status || 'published'
                    }
                  });
                };



                return (
                  <div className="space-y-4">
                    {/* Render existing blocks if any */}
                    {!hasNoBlocks && (
                      <Sortable value={localBlocks} onValueChange={handleReorder} getItemValue={(item) => item.id} className="space-y-3">
                        {localBlocks.map((block, idx) => {
                          let leftColor = 'border-l-blue-500';
                          let blockName = 'Bilinmeyen Blok';
                          let icon = '🗂️';

                          if (block.type === 'hero_banner') {
                            leftColor = 'border-l-blue-500';
                            blockName = 'Giriş Görseli (Hero Banner)';
                            icon = '🖼️';
                          } else if (block.type === 'rich_text') {
                            leftColor = 'border-l-purple-500';
                            blockName = 'Zengin Metin Alanı (Rich Text)';
                            icon = '✍️';
                          } else if (block.type === 'collection_display') {
                            leftColor = 'border-l-amber-500';
                            blockName = 'Koleksiyon Listeleme (Collection Display)';
                            icon = '🗂️';
                          } else if (block.type === 'entry_callout') {
                            leftColor = 'border-l-emerald-500';
                            blockName = 'Görsel Callout Paneli (Callout Banner)';
                            icon = '📢';
                          } else if (block.type === 'statistics_block') {
                            leftColor = 'border-l-rose-500';
                            blockName = 'İstatistik Sayacı (Statistics Grid)';
                            icon = '📊';
                          } else if (block.type === 'faq_accordion') {
                            leftColor = 'border-l-teal-500';
                            blockName = 'Sıkça Sorulan Sorular (FAQ Accordion)';
                            icon = '❓';
                          } else if (block.type === 'features_grid') {
                            leftColor = 'border-l-indigo-500';
                            blockName = 'Özellik Izgarası (Features Grid)';
                            icon = '🚀';
                          } else if (block.type === 'integrations_logos') {
                            leftColor = 'border-l-sky-500';
                            blockName = 'Entegrasyon Logoları (Integrations Logos Grid)';
                            icon = '🔌';
                          } else if (block.type === 'testimonial_card') {
                            leftColor = 'border-l-pink-500';
                            blockName = 'Müşteri Değerlendirmeleri (Testimonials Grid)';
                            icon = '💬';
                          } else if (block.type === 'timeline_milestones') {
                            leftColor = 'border-l-amber-600';
                            blockName = 'Zaman Çizelgesi (Timeline Milestones)';
                            icon = '📅';
                          } else if (block.type === 'event_banner') {
                            leftColor = 'border-l-violet-500';
                            blockName = 'Etkinlik & Webinar Duyurusu (Event Banner)';
                            icon = '🎟️';
                          } else if (block.type === 'team_grid') {
                            leftColor = 'border-l-slate-400';
                            blockName = 'Ekip Üyeleri Izgarası (Team Grid)';
                            icon = '👥';
                          } else if (block.type === 'pricing_block') {
                            leftColor = 'border-l-cyan-500';
                            blockName = 'Fiyatlandırma Tablosu (Pricing)';
                            icon = '💳';
                          } else if (block.type === 'cta_block') {
                            leftColor = 'border-l-orange-500';
                            blockName = 'Aksiyon Çağrısı (CTA)';
                            icon = '🎯';
                          } else if (block.type === 'video_block') {
                            leftColor = 'border-l-red-500';
                            blockName = 'Video Tanıtım (Video)';
                            icon = '🎥';
                          } else if (block.type === 'blog_posts') {
                            leftColor = 'border-l-lime-600';
                            blockName = 'Son Yazılar / Blog (Blog)';
                            icon = '📰';
                          } else if (block.type === 'newsletter_subscribe') {
                            leftColor = 'border-l-emerald-600';
                            blockName = 'Bülten Aboneliği (Newsletter)';
                            icon = '✉️';
                          } else if (block.type === 'steps_timeline') {
                            leftColor = 'border-l-yellow-600';
                            blockName = 'Nasıl Çalışır? (Steps)';
                            icon = '👣';
                          } else if (block.type === 'google_maps') {
                            leftColor = 'border-l-blue-600';
                            blockName = 'Harita (Google Maps)';
                            icon = '📍';
                          }

                          return (
                            <SortableItem key={block.id || idx} value={block.id}>
                              <SortableItemHandle asChild>
                                <div
                                  className={`bg-white border border-slate-200 border-l-4 ${leftColor} p-4 rounded-xl flex items-center justify-between hover:shadow-xs transition-all`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Grid className="size-4 text-slate-400" />
                                    <span className="text-lg">{icon}</span>
                                    <div>
                                      <span className="font-bold text-sm text-slate-800">{blockName}</span>
                                      <span className="text-[10px] text-slate-400 block mt-0.5">Tip: {block.type}</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="xs"
                                      className="h-8 px-3 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Düzenle
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="xs"
                                      className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBlockToDeleteId(block.id);
                                        setBlockDeleteConfirmOpen(true);
                                      }}
                                    >
                                      <Trash className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </SortableItemHandle>
                            </SortableItem>
                          );
                        })}
                      </Sortable>
                    )}

                    {/* Always visible Add Block button at the bottom */}
                    <div className={`flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-2xl bg-white shadow-xs ${!hasNoBlocks ? 'mt-4' : 'p-20'}`}>
                      <Button
                        type="button"
                        size="lg"
                        className="gap-2 font-bold px-6 py-5 rounded-xl shadow-md hover:shadow-lg transition-all"
                        onClick={() => {
                          setAddBlockDrawerOpen(true);
                        }}
                      >
                        <Plus className="size-5" />
                        Add Block
                      </Button>
                      {hasNoBlocks && (
                        <span className="text-xs text-slate-400 mt-2">Henüz hiç bölüm eklenmemiş. Yeni bir bölüm eklemek için tıklayın.</span>
                      )}
                    </div>
                  </div>
                );
              })()
            )
          )
        )}
      </Container>

      {dialogOpen && activeType && (
        <ContentEntryDialog
          open={dialogOpen}
          closeDialog={() => setDialogOpen(false)}
          contentType={activeType}
          entry={selectedEntry}
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İçeriği Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'content_entries.delete_confirm',
                'Bu içeriği kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" className="gap-1.5 h-9 rounded-lg">
                <X className="size-4" />
                Vazgeç
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild onClick={(e) => { e.preventDefault(); confirmDelete(); }}>
              <Button type="button" variant="destructive" className="gap-1.5 h-9 rounded-lg" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <Trash className="size-4" />
                )}
                Kalıcı Olarak Sil
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blockDeleteConfirmOpen} onOpenChange={setBlockDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bölümü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu bölümü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" className="gap-1.5 h-9 rounded-lg">
                <X className="size-4" />
                Vazgeç
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild onClick={(e) => { e.preventDefault(); confirmDeleteBlock(); }}>
              <Button type="button" variant="destructive" className="gap-1.5 h-9 rounded-lg" disabled={updateBlocksMutation.isPending}>
                {updateBlocksMutation.isPending ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <Trash className="size-4" />
                )}
                Kalıcı Olarak Sil
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RightDrawer
        open={addBlockDrawerOpen}
        onOpenChange={setAddBlockDrawerOpen}
        title={selectedBlockForVariant ? `${selectedBlockForVariant.name} Varyasyonları` : "Bölüm Ekle"}
        size="5xl"
      >
        <div className="space-y-5 flex flex-col h-full overflow-hidden">
          {selectedBlockForVariant ? (
            <div className="flex flex-col h-full overflow-hidden space-y-4 transition-all duration-300">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setSelectedBlockForVariant(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-active select-none shrink-0 self-start pb-2 border-b border-border w-full text-start"
              >
                <ArrowLeft className="size-4" />
                Geri Dön
              </button>

              {/* Variations list */}
              <div className="space-y-3 overflow-y-auto pr-1 pb-6 flex-1 hover-scroll-overlay-y">
                {(blockVariations[selectedBlockForVariant.type] || fallbackVariations).map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleAddBlock(selectedBlockForVariant.type, v.id)}
                    data-block-variant={v.id}
                    className="group border border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 cursor-pointer transition-all select-none"
                  >
                    <div className="w-full md:w-56 shrink-0">
                      {v.wireframe}
                    </div>
                    <div className="flex-1 text-start space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 transition-colors group-hover:text-primary">
                        {v.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {v.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className="relative shrink-0">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Blok ara..."
                  value={blockSearchQuery}
                  onChange={(e) => setBlockSearchQuery(e.target.value)}
                  className="ps-9 h-10"
                />
              </div>

              {/* Tabs Container */}
              <Tabs defaultValue="ready" className="w-full flex-1 flex flex-col overflow-hidden">
                <TabsList variant="line" size="sm" className="w-full justify-start border-b border-border shrink-0">
                  <TabsTrigger variant="line" value="ready" className="px-4 py-2 font-semibold">Hazır Bölümler</TabsTrigger>
                  <TabsTrigger variant="line" value="layout" className="px-4 py-2 font-semibold">Kolon Düzenleri</TabsTrigger>
                </TabsList>

                {/* Ready Sections Tab Content */}
                <TabsContent value="ready" className="mt-4 flex-1 overflow-y-auto pr-1">
                  {filteredReadyBlocks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                      Aradığınız kriterde blok bulunamadı.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 pb-6">
                      {filteredReadyBlocks.map((b) => {
                        const IconComponent = b.icon;
                        return (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedBlockForVariant(b);
                            }}
                            className="group border border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center select-none"
                          >
                            <div className="p-3 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
                              <IconComponent className="size-5" />
                            </div>
                            <span className="font-bold text-xs text-slate-800 transition-colors group-hover:text-primary">
                              {b.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {b.description}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Layout Templates Tab Content */}
                <TabsContent value="layout" className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3 pb-6">
                  {/* Tekli Kolon (100%) */}
                  <div
                    onClick={() => toast.info('Tekli Kolon (100%) seçildi!')}
                    className="group border border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-3 select-none"
                  >
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-lg h-10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20"></div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-800 transition-colors group-hover:text-primary">Tekli Kolon (100%)</span>
                      <span className="text-[10px] text-slate-400">Tam genişlikte tek bir alan oluşturur.</span>
                    </div>
                  </div>

                  {/* İki Eşit Kolon (50% + 50%) */}
                  <div
                    onClick={() => toast.info('İki Eşit Kolon (50% + 50%) seçildi!')}
                    className="group border border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-3 select-none"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg h-10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20"></div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg h-10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-800 transition-colors group-hover:text-primary">İki Eşit Kolon (50% + 50%)</span>
                      <span className="text-[10px] text-slate-400">Yan yana iki eşit alan oluşturur.</span>
                    </div>
                  </div>

                  {/* Üç Eşit Kolon (33% * 3) */}
                  <div
                    onClick={() => toast.info('Üç Eşit Kolon (33% * 3) seçildi!')}
                    className="group border border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-3 select-none"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg h-10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20"></div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg h-10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20"></div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg h-10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-800 transition-colors group-hover:text-primary">Üç Eşit Kolon (33% * 3)</span>
                      <span className="text-[10px] text-slate-400">Yan yana üç eşit alan oluşturur.</span>
                    </div>
                  </div>

                  {/* Sol Dar, Sağ Geniş (33% + 66%) */}
                  <div
                    onClick={() => toast.info('Sol Dar, Sağ Geniş (33% + 66%) seçildi!')}
                    className="group border border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-3 select-none"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg h-10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20 col-span-1"></div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg h-10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20 col-span-2"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-800 transition-colors group-hover:text-primary">Sol Dar, Sağ Geniş (33% + 66%)</span>
                      <span className="text-[10px] text-slate-400">Sol tarafı dar, sağ tarafı geniş yan yana iki alan oluşturur.</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </RightDrawer>
    </>
  );
}
