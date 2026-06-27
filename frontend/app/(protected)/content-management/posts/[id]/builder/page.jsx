'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  LoaderCircleIcon,
  Globe,
  Settings,
  Sparkles,
  ArrowUpRight,
  Eye,
  FileText,
  FileImage,
  Layers,
  ChevronRight,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Container } from '@/components/common/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import BlockEditor from '../../components/block-editor';

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
    <div className="space-y-2 w-full">
      {items.length > 5 && (
        <div className="relative">
          <Search className="size-3.5 absolute left-2.5 top-2 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder || "Ara..."}
            className="pl-8 h-8 text-[11px] bg-card"
          />
        </div>
      )}
      <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto p-1.5 border border-border/80 rounded-xl bg-muted/5">
        {filteredItems.map((item) => {
          const title = item.title || item.name;
          const label = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
          const isSelected = selectedIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer select-none transition-all duration-150 ${
                isSelected
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/45 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`size-3.5 rounded border flex items-center justify-center transition-all shrink-0 ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              }`}>
                {isSelected && <Check className="size-2.5 stroke-[3]" />}
              </div>
              <span className="truncate">{label}</span>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="py-4 text-center text-xs text-muted-foreground">
            {placeholder || "Bulunamadı."}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuilderPage({ params }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);

  const [activeLang, setActiveLang] = useState('tr');

  // Form states
  // Form states
  const isCreateMode = id === 'new';

  const [title, setTitle] = useState({ tr: '', en: '' });
  const [slug, setSlug] = useState({ tr: '', en: '' });
  const [content, setContent] = useState([]); // block list array
  const [summary, setSummary] = useState({ tr: '', en: '' });
  const [coverImageId, setCoverImageId] = useState(null);
  const [readingTime, setReadingTime] = useState('5');
  const [publishDate, setPublishDate] = useState('');
  const [status, setStatus] = useState('published');
  const [categoryIds, setCategoryIds] = useState([]);

  // Fetch categories of type 'blog'
  const { data: categories } = useQuery({
    queryKey: ['admin-categories-blog'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories?type=blog');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch specific post details (disabled in create mode)
  const { data: postPayload, isLoading: isLoadingPost, isError } = useQuery({
    queryKey: ['admin-post', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/posts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      const json = await res.json();
      return json.data || null;
    },
    enabled: !isCreateMode,
  });

  const isLoading = !isCreateMode && isLoadingPost;

  // Initialize default date in create mode
  useEffect(() => {
    if (isCreateMode) {
      setPublishDate(new Date().toISOString().substring(0, 16));
    }
  }, [isCreateMode]);

  // Load post details into state
  useEffect(() => {
    if (postPayload && !isCreateMode) {
      setTitle({
        tr: postPayload.data?.title?.tr || '',
        en: postPayload.data?.title?.en || '',
      });
      setSlug({
        tr: postPayload.data?.slug?.tr || '',
        en: postPayload.data?.slug?.en || '',
      });
      setSummary({
        tr: postPayload.data?.summary?.tr || '',
        en: postPayload.data?.summary?.en || '',
      });
      setCoverImageId(postPayload.data?.cover_image?.id || null);
      setReadingTime(postPayload.data?.reading_time ? String(postPayload.data.reading_time) : '5');
      setPublishDate(postPayload.published_at ? postPayload.published_at.substring(0, 16) : '');
      setStatus(postPayload.status || 'published');
      setCategoryIds(postPayload.data?.category_ids || postPayload.data?.categories?.map(c => c.id) || []);

      // Dynamic conversion to block editor
      let contentVal = postPayload.data?.content || [];
      if (typeof contentVal === 'string') {
        contentVal = [
          { id: 'block_init_tr', type: 'text', data: { text: { tr: contentVal, en: '' } } }
        ];
      } else if (contentVal && typeof contentVal === 'object' && !Array.isArray(contentVal)) {
        contentVal = [
          { id: 'block_init_1', type: 'text', data: { text: { tr: contentVal.tr || '', en: contentVal.en || '' } } }
        ];
      }
      setContent(contentVal);
    }
  }, [postPayload, isCreateMode]);

  const handleTitleChange = (lang, value) => {
    setTitle((prev) => ({ ...prev, [lang]: value }));
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setSlug((prev) => ({ ...prev, [lang]: generatedSlug }));
  };

  const handleCategorySelect = (catId) => {
    const cid = Number(catId);
    setCategoryIds((prev) =>
      prev.includes(cid) ? prev.filter((i) => i !== cid) : [...prev, cid]
    );
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const url = isCreateMode ? '/api/admin/posts' : `/api/admin/posts/${id}`;
      const method = isCreateMode ? 'POST' : 'PUT';

      const res = await apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Yazı kaydedilemedi');
      }

      return res.json();
    },
    onSuccess: (json) => {
      const newPost = json.data;
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isCreateMode ? 'Yazı başarıyla oluşturuldu.' : 'Değişiklikler başarıyla kaydedildi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );

      if (isCreateMode && newPost?.id) {
        router.replace(`/content-management/posts/${newPost.id}/builder`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin-post', id] });
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Kaydedilirken bir hata oluştu.');
    },
  });

  const handleSave = () => {
    if (!title.tr) {
      toast.error('Türkçe yazı başlığı girmek zorunludur.');
      return;
    }

    const payload = {
      title,
      slug,
      content, // blocks array
      summary,
      cover_image_id: coverImageId,
      reading_time: Number(readingTime) || 5,
      publish_date: publishDate || null,
      status,
      category_ids: categoryIds,
    };

    saveMutation.mutate(payload);
  };

  // Convert back to simple HTML format
  const handleConvertToClassic = () => {
    const confirmConversion = confirm(
      'Yazıyı klasik (HTML) metin formatına geri dönüştürmek istediğinizden emin misiniz? Bu işlem blok yapısını (galeriler, yarış vitrinleri vb.) düzleştirerek sade metin paragraflarına dönüştürecektir.'
    );
    if (!confirmConversion) return;

    // Simple flat mapping of text contents from blocks to build flat HTML string
    let trHtml = '';
    let enHtml = '';

    content.forEach((block) => {
      if (block.type === 'text') {
        trHtml += block.data.text?.tr || '';
        enHtml += block.data.text?.en || '';
      } else if (block.type === 'heading') {
        const tag = block.data.level || 'h2';
        const txtTr = block.data.text?.tr || '';
        const txtEn = block.data.text?.en || '';
        if (txtTr) trHtml += `<${tag}>${txtTr}</${tag}>`;
        if (txtEn) enHtml += `<${tag}>${txtEn}</${tag}>`;
      } else if (block.type === 'quote') {
        const txtTr = block.data.text?.tr || '';
        const txtEn = block.data.text?.en || '';
        const auth = block.data.author || '';
        if (txtTr) trHtml += `<blockquote><p>${txtTr}</p>${auth ? `<cite>— ${auth}</cite>` : ''}</blockquote>`;
        if (txtEn) enHtml += `<blockquote><p>${txtEn}</p>${auth ? `<cite>— ${auth}</cite>` : ''}</blockquote>`;
      }
    });

    const payload = {
      title,
      slug,
      content: { tr: trHtml, en: enHtml }, // Save as simple HTML object
      summary,
      cover_image_id: coverImageId,
      reading_time: Number(readingTime) || 5,
      publish_date: publishDate || null,
      status,
      category_ids: categoryIds,
    };

    saveMutation.mutate(payload, {
      onSuccess: () => {
        router.push('/content-management/posts');
        toast.success('Yazı başarıyla klasik HTML formatına dönüştürüldü.');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-3 py-12">
        <LoaderCircleIcon className="size-8 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground font-bold">Gelişmiş editör yükleniyor...</span>
      </div>
    );
  }

  if (isError || (!isCreateMode && !postPayload)) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center py-12">
        <RiErrorWarningFill className="size-12 text-destructive/80 mb-3" />
        <h2 className="text-lg font-bold text-foreground">Yüklenemedi</h2>
        <p className="text-xs text-muted-foreground mt-1.5 mb-4">
          Düzenlenmek istenen yazı kaydı yüklenemedi veya böyle bir kayıt bulunmuyor.
        </p>
        <Button onClick={() => router.push('/content-management/posts')} className="h-9 rounded-lg gap-1.5">
          <ArrowLeft className="size-4" /> Yazı Listesine Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/10">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/content-management/posts')}
            className="size-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 border border-border bg-card"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="size-3.5 text-primary" /> Gelişmiş Sayfa Oluşturucu
              </span>
              <ChevronRight className="size-3.5 text-muted-foreground/45" />
              {status === 'published' && (
                <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0 h-4.5 text-[9px] rounded">
                  Yayınlandı
                </Badge>
              )}
              {status === 'draft' && (
                <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0 h-4.5 text-[9px] rounded">
                  Taslak
                </Badge>
              )}
              {status === 'archived' && (
                <Badge className="bg-zinc-500/10 border-zinc-500/20 text-zinc-500 font-bold px-1.5 py-0 h-4.5 text-[9px] rounded">
                  Arşivlendi
                </Badge>
              )}
            </div>
            <h1 className="font-extrabold text-sm text-foreground truncate mt-0.5" title={title.tr}>
              {title.tr || 'Başlıksız Yazı'}
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Active Lang Buttons */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/20 shrink-0">
            <button
              onClick={() => setActiveLang('tr')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                activeLang === 'tr' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground/80 hover:text-foreground'
              }`}
            >
              TR
            </button>
            <button
              onClick={() => setActiveLang('en')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                activeLang === 'en' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground/80 hover:text-foreground'
              }`}
            >
              EN
            </button>
          </div>

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="gap-1.5 h-9 rounded-lg font-bold text-xs shadow-xs"
          >
            {saveMutation.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Kaydet & Güncelle
          </Button>
        </div>
      </header>

      {/* Main Builder Area: Split Columns */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch overflow-hidden">
        {/* Left Column: Notion-style Editor Sheet */}
        <main className="flex-1 overflow-y-auto px-8 sm:px-16 py-12 flex justify-center bg-card">
          <div className="w-full max-w-5xl space-y-8 min-h-[500px]">
            {/* Localized Title & Inline Permalink Editor (Gutenberg-style) */}
            <div className="space-y-3 pb-6 border-b border-border/40">
              <input
                type="text"
                value={title[activeLang] || ''}
                onChange={(e) => handleTitleChange(activeLang, e.target.value)}
                placeholder="Başlık ekleyin"
                className="w-full text-4xl sm:text-5xl font-extrabold tracking-tight bg-transparent text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 border-0 p-0"
              />

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/75 font-mono">
                <Globe className="size-3.5 text-muted-foreground/40 shrink-0" />
                <span className="font-semibold text-muted-foreground/60">Yol (Slug):</span>
                <span className="text-muted-foreground/30 select-none">/blog/</span>
                <input
                  type="text"
                  value={slug[activeLang] || ''}
                  onChange={(e) => setSlug((prev) => ({ ...prev, [activeLang]: e.target.value }))}
                  placeholder="yol-slug"
                  className="bg-transparent hover:bg-muted/40 focus:bg-background px-1 py-0.5 rounded border border-transparent focus:border-border/60 focus:outline-none text-muted-foreground font-mono text-xs w-64 transition-colors"
                />
              </div>
            </div>

            {/* Block Editor Panel (Borderless) */}
            <div className="space-y-2 pt-2">
              <BlockEditor
                value={content}
                onChange={setContent}
                activeLang={activeLang}
              />
            </div>
          </div>
        </main>

        {/* Right Column: Settings Sidebar */}
        <aside className="w-full lg:w-[320px] bg-card border-t lg:border-t-0 lg:border-l border-border px-6 py-8 overflow-y-auto space-y-6 shrink-0 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Settings className="size-4 text-muted-foreground" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Yazı Parametreleri</h3>
          </div>

          {/* Cover Image Widget */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">Makale Kapak Resmi</Label>
            <FileUpload
              value={coverImageId ? [coverImageId] : []}
              onChange={(val) => setCoverImageId(val && val.length > 0 ? val[0] : null)}
              isMultiple={false}
            />
          </div>

          {/* Excerpt Summary */}
          <div className="space-y-2">
            <Label htmlFor="builder-summary" className="text-xs font-bold text-foreground">
              Özet / Giriş Metni ({activeLang.toUpperCase()})
            </Label>
            <Textarea
              id="builder-summary"
              value={summary[activeLang] || ''}
              onChange={(e) => setSummary((prev) => ({ ...prev, [activeLang]: e.target.value }))}
              placeholder="Yazının giriş kısmında görünecek kısa metin..."
              rows={4}
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Categories Grid */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">Kategoriler</Label>
            <MultiSelectGrid
              items={categories || []}
              selectedIds={categoryIds}
              onToggle={handleCategorySelect}
              placeholder="Kategori bulunmuyor."
              searchPlaceholder="Kategori ara..."
            />
          </div>

          {/* Status, Reading Time, and Date Grid */}
          <div className="space-y-4 pt-2 border-t border-border/40">
            <div className="space-y-1.5">
              <Label htmlFor="builder-status" className="text-xs font-bold text-foreground">Yayın Durumu</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 bg-card text-xs">
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published" className="text-xs">Yayınlandı (Published)</SelectItem>
                  <SelectItem value="draft" className="text-xs">Taslak (Draft)</SelectItem>
                  <SelectItem value="archived" className="text-xs">Arşivlendi (Archived)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="builder-reading-time" className="text-xs font-bold text-foreground">Okuma Süresi (Dk)</Label>
              <Input
                id="builder-reading-time"
                type="number"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="builder-publish-date" className="text-xs font-bold text-foreground">Yayınlanma Zamanı</Label>
              <Input
                id="builder-publish-date"
                type="datetime-local"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Convert Back to Classic Button */}
          <div className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              onClick={handleConvertToClassic}
              className="w-full h-9 text-[11px] font-bold gap-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg justify-start"
            >
              <RefreshCw className="size-3.5" /> Klasik HTML Metnine Dönüştür
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
