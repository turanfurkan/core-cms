'use client';

import { useEffect, useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Globe, Info, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RightDrawer } from '@/components/common/right-drawer';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

function MultiSelectGrid({ items, selectedIds, onToggle, placeholder, searchPlaceholder }) {
  const [search, setSearch] = useState('');
  
  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      const lower = search.toLowerCase();
      result = items.filter(item => {
        const title = item.title || item.name;
        const text = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
        return text.toLowerCase().includes(lower);
      });
    }

    return [...result].sort((a, b) => {
      const aSel = selectedIds.includes(a.id);
      const bSel = selectedIds.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;

      const titleA = a.title || a.name;
      const labelA = typeof titleA === 'object' ? (titleA.tr || titleA.en || '') : (titleA || '');
      const titleB = b.title || b.name;
      const labelB = typeof titleB === 'object' ? (titleB.tr || titleB.en || '') : (titleB || '');
      return labelA.localeCompare(labelB, 'tr');
    });
  }, [items, search, selectedIds]);

  return (
    <div className="space-y-2.5 w-full">
      {items.length > 5 && (
        <div className="relative">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8.5 pl-8.5 text-xs bg-muted/20 border-border/80 focus:border-primary rounded-lg"
          />
        </div>
      )}

      {filteredItems.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-5">{placeholder}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1 border border-border/60 p-2.5 rounded-lg bg-muted/10">
          {filteredItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const title = item.title || item.name;
            const label = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
            
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className={`flex items-center justify-between text-left p-2.5 rounded-lg text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border/60 hover:bg-muted/30 text-foreground'
                }`}
              >
                <span>{label}</span>
                {isSelected && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PartnerDialog({ open, closeDialog, partner }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!partner?.id;

  const [activeTab, setActiveTab] = useState('general');

  // Form States
  const [name, setName] = useState({ tr: '', en: '' });
  const [link, setLink] = useState('');
  const [status, setStatus] = useState('published');
  const [order, setOrder] = useState('0');
  const [logoId, setLogoId] = useState(null);
  const [categoryIds, setCategoryIds] = useState([]);

  // Load fields when editing
  useEffect(() => {
    if (isEdit && partner) {
      setName({
        tr: partner.name?.tr || '',
        en: partner.name?.en || '',
      });
      setLink(partner.link || '');
      setStatus(partner.status || 'published');
      setOrder(String(partner.order ?? 0));
      setLogoId(partner.logo_id || null);
      setCategoryIds(Array.isArray(partner.categories) ? partner.categories.map(c => c.id) : []);
    } else {
      setName({ tr: '', en: '' });
      setLink('');
      setStatus('published');
      setOrder('0');
      setLogoId(null);
      setCategoryIds([]);
    }
    setActiveTab('general');
  }, [partner, isEdit, open]);

  // Fetch partner categories
  const { data: categories } = useQuery({
    queryKey: ['admin-categories-partner'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories?type=partner');
      if (!res.ok) throw new Error('Failed to fetch partner categories');
      const json = await res.json();
      return json.data || [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = isEdit ? `/api/admin/partners/${partner.id}` : '/api/admin/partners';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Bir hata oluştu.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      toast.success(isEdit ? 'Sponsor başarıyla güncellendi.' : 'Sponsor başarıyla eklendi.');
      closeDialog();
    },
    onError: (err) => {
      toast.error(err.message || 'İşlem başarısız.');
    },
  });

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!name.tr) {
      toast.error('Türkçe sponsor adı girmek zorunludur.');
      return;
    }

    const payload = {
      name,
      link: link || null,
      status,
      order: Number(order) || 0,
      logo_id: logoId,
      category_ids: categoryIds,
    };

    mutation.mutate(payload);
  };

  const handleCategorySelect = (catId) => {
    const id = Number(catId);
    setCategoryIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <RightDrawer
      open={open}
      onClose={closeDialog}
      title={isEdit ? 'Sponsoru Düzenle' : 'Yeni Sponsor Ekle'}
      description="Sponsor veya partner logo ve bilgilerini düzenleyin."
      footer={
        <div className="flex items-center gap-2 justify-end w-full">
          <Button type="button" variant="outline" size="sm" onClick={closeDialog} className="rounded-xl">
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            size="sm"
            disabled={mutation.isPending}
            className="gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all"
          >
            {mutation.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Kaydet
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 bg-muted/40 border border-border/60 p-1 rounded-xl mb-6">
          <TabsTrigger value="general" className="text-xs font-semibold py-2 rounded-lg">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="media" className="text-xs font-semibold py-2 rounded-lg">Logo & Ayarlar</TabsTrigger>
        </TabsList>

        {/* Tab 1: General Info */}
        <TabsContent value="general" className="space-y-5 mt-0">
          {/* TR Name */}
          <div className="space-y-1.5">
            <Label htmlFor="partner-name-tr" className="flex items-center gap-1.5">
              Sponsor Adı (TR)
              <Globe className="size-3 text-muted-foreground" title="Çevrilebilir Alan" />
            </Label>
            <Input
              id="partner-name-tr"
              value={name.tr}
              onChange={(e) => setName((prev) => ({ ...prev, tr: e.target.value }))}
              placeholder="Örn: Garmin"
              className="bg-card border-border/80 rounded-lg text-xs"
            />
          </div>

          {/* EN Name */}
          <div className="space-y-1.5">
            <Label htmlFor="partner-name-en" className="flex items-center gap-1.5">
              Sponsor Adı (EN)
              <Globe className="size-3 text-muted-foreground" title="Çevrilebilir Alan" />
            </Label>
            <Input
              id="partner-name-en"
              value={name.en}
              onChange={(e) => setName((prev) => ({ ...prev, en: e.target.value }))}
              placeholder="Örn: Garmin UK"
              className="bg-card border-border/80 rounded-lg text-xs"
            />
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <Label htmlFor="partner-link">Web Sitesi Bağlantısı (URL)</Label>
            <Input
              id="partner-link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://garmin.com"
              className="bg-card border-border/80 rounded-lg text-xs"
            />
          </div>
        </TabsContent>

        {/* Tab 2: Logo & Categories */}
        <TabsContent value="media" className="space-y-5 mt-0">
          {/* FileUpload for Logo */}
          <div className="space-y-1.5">
            <Label>Sponsor Logosu</Label>
            <FileUpload
              value={logoId ? [logoId] : []}
              onChange={(val) => setLogoId(val && val.length > 0 ? val[0] : null)}
              isMultiple={false}
            />
          </div>

          {/* Categories */}
          <div className="space-y-1.5 pt-2">
            <Label className="flex items-center gap-1.5">
              Sponsor Kategorileri
              <span className="text-[10px] text-muted-foreground font-normal">(Çoklu seçim yapılabilir)</span>
            </Label>
            <MultiSelectGrid
              items={categories || []}
              selectedIds={categoryIds}
              onToggle={handleCategorySelect}
              placeholder="Sponsor kategorisi bulunamadı. Lütfen önce Kategoriler sayfasından 'Sponsorlar' türünde bir kategori ekleyin."
              searchPlaceholder="Kategori ara..."
            />
          </div>

          {/* Order and Status */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="partner-status">Durum</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="partner-status" className="h-9 text-xs bg-card border-border/80 rounded-lg">
                  <SelectValue placeholder="Durum Seçin" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="published">🟢 Yayında</SelectItem>
                  <SelectItem value="draft">⚪ Taslak</SelectItem>
                  <SelectItem value="archived">🔴 Arşivlendi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="partner-order">Sıralama</Label>
              <Input
                id="partner-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="0"
                className="bg-card border-border/80 rounded-lg text-xs"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </RightDrawer>
  );
}
