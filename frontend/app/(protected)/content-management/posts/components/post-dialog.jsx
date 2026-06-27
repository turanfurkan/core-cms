'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Globe, Info, FileImage, Check, Search, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RightDrawer } from '@/components/common/right-drawer';
import { FileUpload } from '@/components/ui/file-upload';
import RichTextEditor from '@/components/common/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';

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
            placeholder={searchPlaceholder || "Ara..."}
            className="pl-9 h-8.5 text-xs bg-card"
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto p-1.5 border border-border/80 rounded-xl bg-muted/5">
        {filteredItems.map((item) => {
          const title = item.title || item.name;
          const label = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
          const isSelected = selectedIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer select-none transition-all duration-150 ${
                isSelected
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`size-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              }`}>
                {isSelected && <Check className="size-3 stroke-[3]" />}
              </div>
              <span className="truncate">{label}</span>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-muted-foreground">
            {placeholder || "Öğe bulunamadı."}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostDialog({ open, closeDialog, post }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isEdit = !!post?.id;

  const [activeTab, setActiveTab] = useState('general');
  const [activeLang, setActiveLang] = useState('tr');

  // Form state
  const [title, setTitle] = useState({ tr: '', en: '' });
  const [slug, setSlug] = useState({ tr: '', en: '' });
  const [content, setContent] = useState({ tr: '', en: '' }); // HTML strings by default
  const [isAdvanced, setIsAdvanced] = useState(false); // Flag if post uses block builder
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

  // Populate data when editing
  useEffect(() => {
    if (open) {
      setActiveTab('general');
      setActiveLang('tr');

      if (post) {
        setTitle({
          tr: post.data?.title?.tr || '',
          en: post.data?.title?.en || '',
        });
        setSlug({
          tr: post.data?.slug?.tr || '',
          en: post.data?.slug?.en || '',
        });
        
        const contentVal = post.data?.content || { tr: '', en: '' };
        if (Array.isArray(contentVal)) {
          setIsAdvanced(true);
          setContent(contentVal); // Store array blocks
        } else {
          setIsAdvanced(false);
          setContent({
            tr: typeof contentVal === 'string' ? contentVal : (contentVal.tr || ''),
            en: typeof contentVal === 'string' ? '' : (contentVal.en || ''),
          });
        }

        setSummary({
          tr: post.data?.summary?.tr || '',
          en: post.data?.summary?.en || '',
        });
        setCoverImageId(post.data?.cover_image?.id || null);
        setReadingTime(post.data?.reading_time ? String(post.data.reading_time) : '5');
        setPublishDate(post.published_at ? post.published_at.substring(0, 16) : '');
        setStatus(post.status || 'published');
        setCategoryIds(post.data?.category_ids || post.data?.categories?.map(c => c.id) || []);
      } else {
        setTitle({ tr: '', en: '' });
        setSlug({ tr: '', en: '' });
        setContent({ tr: '', en: '' });
        setIsAdvanced(false);
        setSummary({ tr: '', en: '' });
        setCoverImageId(null);
        setReadingTime('5');
        setPublishDate(new Date().toISOString().substring(0, 16));
        setStatus('published');
        setCategoryIds([]);
      }
    }
  }, [open, post]);

  const handleTitleChange = (lang, value) => {
    setTitle((prev) => ({ ...prev, [lang]: value }));
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setSlug((prev) => ({ ...prev, [lang]: generatedSlug }));
  };

  // Mutation
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit ? `/api/admin/posts/${post.id}` : '/api/admin/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to save post');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>
              {isEdit ? 'Yazı başarıyla güncellendi.' : 'Yeni yazı başarıyla oluşturuldu.'}
            </AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      closeDialog();
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || 'Yazı kaydedilemedi.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!title.tr) {
      toast.error('Türkçe yazı başlığı girmek zorunludur.');
      return;
    }

    const payload = {
      title,
      slug,
      content,
      summary,
      cover_image_id: coverImageId,
      reading_time: Number(readingTime) || 5,
      publish_date: publishDate || null,
      status,
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

  const handleAdvancedEditorClick = async () => {
    if (isEdit) {
      closeDialog();
      router.push(`/content-management/posts/${post.id}/builder`);
    } else {
      try {
        const draftTitle = title.tr.trim() || `Taslak Yazı - ${new Date().toLocaleString('tr-TR')}`;
        let draftSlug = slug.tr.trim();
        if (!draftSlug) {
          draftSlug = draftTitle
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        }

        const payload = {
          title: { tr: draftTitle, en: title.en.trim() || draftTitle },
          slug: { tr: draftSlug, en: slug.en.trim() || draftSlug },
          content: [],
          summary: { tr: summary.tr || '', en: summary.en || '' },
          cover_image_id: coverImageId,
          reading_time: Number(readingTime) || 5,
          publish_date: publishDate || null,
          status: 'draft',
          category_ids: categoryIds,
        };

        const res = await apiFetch('/api/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error('Taslak oluşturulamadı.');
        }

        const json = await res.json();
        const postId = json.id || json.data?.id;

        if (!postId) {
          throw new Error('Yeni oluşturulan yazının ID bilgisi alınamadı.');
        }

        queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
        closeDialog();
        router.push(`/content-management/posts/${postId}/builder`);
      } catch (err) {
        toast.error(err.message || 'Gelişmiş editör açılırken hata oluştu.');
      }
    }
  };

  const footerContent = (
    <div className="flex justify-end gap-2 w-full">
      <Button type="button" variant="outline" onClick={closeDialog} className="h-9 rounded-lg">
        İptal
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={handleAdvancedEditorClick}
        disabled={mutation.isPending}
        className="gap-1.5 h-9 rounded-lg border-primary/30 text-primary hover:bg-primary/5 font-semibold text-xs transition-all duration-150"
      >
        <Sparkles className="size-3.5 text-primary" /> Gelişmiş Editörle Düzenle
      </Button>
      <Button
        type="submit"
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="gap-1.5 h-9 rounded-lg"
      >
        {mutation.isPending ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {isEdit ? 'Güncelle' : 'Kaydet'}
      </Button>
    </div>
  );

  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={isEdit ? `Yazı Düzenle: ${post.data?.title?.tr}` : 'Yeni Yazı Kaydı'}
      size="5xl"
      footer={footerContent}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="line" className="w-full justify-start bg-transparent pb-0 mb-6 overflow-x-auto flex flex-nowrap shrink-0">
          <TabsTrigger value="general" className="gap-1.5 text-xs font-bold py-2"><Info className="size-3.5" /> Genel İçerik</TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5 text-xs font-bold py-2"><FileImage className="size-3.5" /> Görsel & Ayarlar</TabsTrigger>
        </TabsList>

        {/* Tab 1: General Info */}
        <TabsContent value="general" className="space-y-5 mt-0">
          <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
            <TabsList variant="line" size="sm" className="w-fit bg-transparent pb-0 mb-3">
              <TabsTrigger value="tr" className="gap-1 px-2.5 py-1 text-xs">TR</TabsTrigger>
              <TabsTrigger value="en" className="gap-1 px-2.5 py-1 text-xs">EN</TabsTrigger>
            </TabsList>

            <TabsContent value="tr" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label htmlFor="post-title-tr">Yazı Başlığı (TR) <span className="text-red-500">*</span></Label>
                <Input
                  id="post-title-tr"
                  value={title.tr}
                  onChange={(e) => handleTitleChange('tr', e.target.value)}
                  placeholder="Örn: Bisiklet Yarışına Hazırlık İpuçları"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-slug-tr">Slug (TR)</Label>
                <Input
                  id="post-slug-tr"
                  value={slug.tr}
                  onChange={(e) => setSlug((prev) => ({ ...prev, tr: e.target.value }))}
                  placeholder="bisiklet-yarisina-hazirlik-ipuclari"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-summary-tr">Özet / Excerpt (TR)</Label>
                <Textarea
                  id="post-summary-tr"
                  value={summary.tr}
                  onChange={(e) => setSummary((prev) => ({ ...prev, tr: e.target.value }))}
                  placeholder="Kısa giriş metni..."
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>İçerik (TR)</Label>
                {isAdvanced ? (
                  <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-blue-600 dark:text-blue-400 font-semibold leading-relaxed my-2">
                    ℹ️ Bu yazı Gelişmiş Editör (Blok Yapısı) ile oluşturulmuştur. Düzenlemek için lütfen sağ alttaki <b>Gelişmiş Editörle Düzenle</b> butonuna tıklayın.
                  </div>
                ) : (
                  <RichTextEditor
                    value={content.tr || ''}
                    onChange={(val) => setContent((prev) => ({ ...prev, tr: val }))}
                    placeholder="Yazı detaylı içeriği..."
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label htmlFor="post-title-en">Yazı Başlığı (EN)</Label>
                <Input
                  id="post-title-en"
                  value={title.en}
                  onChange={(e) => handleTitleChange('en', e.target.value)}
                  placeholder="e.g. Preparing for Cycling Race Tips"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-slug-en">Slug (EN)</Label>
                <Input
                  id="post-slug-en"
                  value={slug.en}
                  onChange={(e) => setSlug((prev) => ({ ...prev, en: e.target.value }))}
                  placeholder="preparing-for-cycling-race-tips"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-summary-en">Özet / Excerpt (EN)</Label>
                <Textarea
                  id="post-summary-en"
                  value={summary.en}
                  onChange={(e) => setSummary((prev) => ({ ...prev, en: e.target.value }))}
                  placeholder="Short summary excerpt..."
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>İçerik (EN)</Label>
                {isAdvanced ? (
                  <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-blue-600 dark:text-blue-400 font-semibold leading-relaxed my-2">
                    ℹ️ Bu yazı Gelişmiş Editör (Blok Yapısı) ile oluşturulmuştur. Düzenlemek için lütfen sağ alttaki <b>Gelişmiş Editörle Düzenle</b> butonuna tıklayın.
                  </div>
                ) : (
                  <RichTextEditor
                    value={content.en || ''}
                    onChange={(val) => setContent((prev) => ({ ...prev, en: val }))}
                    placeholder="Detailed article content..."
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label>Kategoriler</Label>
            <MultiSelectGrid
              items={categories || []}
              selectedIds={categoryIds}
              onToggle={handleCategorySelect}
              placeholder="Kategori bulunmuyor."
              searchPlaceholder="Kategori ara..."
            />
          </div>
        </TabsContent>

        {/* Tab 2: Settings & Media */}
        <TabsContent value="media" className="space-y-5 mt-0">
          <div className="space-y-1.5">
            <Label>Kapak Resmi (Cover Image)</Label>
            <FileUpload
              value={coverImageId ? [coverImageId] : []}
              onChange={(val) => setCoverImageId(val && val.length > 0 ? val[0] : null)}
              isMultiple={false}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="post-reading-time">Okuma Süresi (Dakika)</Label>
              <Input
                id="post-reading-time"
                type="number"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                placeholder="5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="post-publish-date">Yayınlanma Zamanı</Label>
              <Input
                id="post-publish-date"
                type="datetime-local"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Yayın Durumu</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Yayınlandı (Published)</SelectItem>
                  <SelectItem value="draft">Taslak (Draft)</SelectItem>
                  <SelectItem value="archived">Arşivlendi (Archived)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </RightDrawer>
  );
}
