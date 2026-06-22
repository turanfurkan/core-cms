'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RightDrawer } from '@/components/common/right-drawer';
import RichTextEditor from '@/components/common/rich-text-editor';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const getMediaIds = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map(item => (typeof item === 'object' && item !== null ? item.id : item));
  }
  if (typeof value === 'object') {
    return value.id ?? '';
  }
  return value;
};

export default function ContentEntryDialog({ open, closeDialog, contentType, entry }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!entry;
  const fields = contentType?.fields || [];

  const [dataValues, setDataValues] = useState({});

  // Fetch active languages
  const { data: languagesResponse, isLoading: isLangLoading } = useQuery({
    queryKey: ['admin-languages-active'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/languages?active_only=true');
      if (!res.ok) throw new Error('Diller yüklenemedi.');
      const json = await res.json();
      return json.data || [];
    },
  });

  const languages = languagesResponse || [{ id: 1, name: 'Türkçe', code: 'tr', is_default: true }];
  const [activeTab, setActiveTab] = useState('tr');

  // Set default tab when languages are loaded
  useEffect(() => {
    if (languages.length > 0) {
      const defaultLang = languages.find((l) => l.is_default) || languages[0];
      setActiveTab(defaultLang.code);
    }
  }, [languagesResponse]);

  useEffect(() => {
    if (open && languages.length > 0) {
      const values = {};
      fields.forEach((field) => {
        const isLocalized = !!field.options?.localized;
        const rawVal = entry?.data?.[field.slug];

        if (isLocalized) {
          const locObj = {};
          languages.forEach((lang) => {
            locObj[lang.code] = '';
          });

          if (rawVal && typeof rawVal === 'object' && !Array.isArray(rawVal)) {
            languages.forEach((lang) => {
              locObj[lang.code] = rawVal[lang.code] ?? '';
            });
          } else if (rawVal !== undefined && rawVal !== null) {
            const defaultLang = languages.find((l) => l.is_default) || languages[0];
            const defaultCode = defaultLang?.code || 'tr';
            locObj[defaultCode] = rawVal;
          }
          values[field.slug] = locObj;
        } else {
          if (rawVal !== undefined && rawVal !== null) {
            values[field.slug] = rawVal;
          } else {
            if (field.type === 'boolean') {
              values[field.slug] = false;
            } else if (field.type === 'integer' || field.type === 'number') {
              values[field.slug] = 0;
            } else if (field.type === 'gallery' || field.type === 'media_gallery') {
              values[field.slug] = [];
            } else {
              values[field.slug] = '';
            }
          }
        }
      });
      setDataValues(values);
    }
  }, [open, entry, fields, languagesResponse]);

  const handleValueChange = (slug, val, langCode) => {
    setDataValues((prev) => {
      const field = fields.find((f) => f.slug === slug);
      const isLocalized = !!field?.options?.localized;
      if (isLocalized) {
        return {
          ...prev,
          [slug]: {
            ...prev[slug],
            [langCode]: val,
          },
        };
      } else {
        return {
          ...prev,
          [slug]: val,
        };
      }
    });
  };



  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/content-types/${contentType.id}/entries/${entry.id}`
        : `/api/admin/content-types/${contentType.id}/entries`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to save entry');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-entries', String(contentType.id)] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'İçerik güncellendi.' : 'Yeni içerik başarıyla eklendi.'}</AlertTitle>
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
            <AlertTitle>{err.message || 'İşlem başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation for required fields
    for (const field of fields) {
      const isRequired = field.validation_rules?.required;
      const isLocalized = !!field.options?.localized;

      if (isRequired) {
        if (isLocalized) {
          for (const lang of languages) {
            const val = dataValues[field.slug]?.[lang.code];
            if (val === undefined || val === null || val === '') {
              toast.custom(
                () => (
                  <Alert variant="mono" icon="destructive" close={false}>
                    <AlertIcon>
                      <RiErrorWarningFill />
                    </AlertIcon>
                    <AlertTitle>{t('content_entries.messages.required_field', { name: `${field.name} (${lang.name})` }).replace('{name}', `${field.name} (${lang.name})`)}</AlertTitle>
                  </Alert>
                ),
                { position: 'top-center' }
              );
              return;
            }
          }
        } else {
          const val = dataValues[field.slug];
          if (val === undefined || val === null || val === '') {
            toast.custom(
              () => (
                <Alert variant="mono" icon="destructive" close={false}>
                  <AlertIcon>
                    <RiErrorWarningFill />
                  </AlertIcon>
                  <AlertTitle>{t('content_entries.messages.required_field', { name: field.name }).replace('{name}', field.name)}</AlertTitle>
                </Alert>
              ),
              { position: 'top-center' }
            );
            return;
          }
        }
      }
    }

    mutation.mutate({
      data: dataValues,
      status: entry?.status || 'draft', // retain status or default draft
    });
  };

  const footerContent = (
    <>
      <Button type="button" variant="outline" onClick={closeDialog}>
        {t('content_entries.dialog.cancel', 'İptal')}
      </Button>
      <Button
        type="submit"
        form="content-entry-form"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <LoaderCircleIcon className="size-4 animate-spin mr-1" />
        ) : (
          <Save className="size-4 mr-1" />
        )}
        {t('content_entries.dialog.save', 'Kaydet')}
      </Button>
    </>
  );

  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={`${isEdit ? t('content_entries.dialog.edit_title', 'İçerik Düzenle') : t('content_entries.dialog.add_title', 'Yeni İçerik Girişi')} (${contentType.name})`}
      size="3xl"
      footer={footerContent}
    >
      {isLangLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <form id="content-entry-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Multilingual Tabs */}
          {languages.length > 1 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList variant="default" size="sm" className="w-full justify-start bg-muted/20 p-1 rounded-lg">
                {languages.map((lang) => (
                  <TabsTrigger key={lang.code} value={lang.code} className="cursor-pointer">
                    {lang.name} ({lang.code.toUpperCase()})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {fields.map((field) => {
            const isLocalized = !!field.options?.localized;
            const val = isLocalized
              ? (dataValues[field.slug]?.[activeTab] ?? '')
              : (dataValues[field.slug] ?? '');
            const isRequired = !!field.validation_rules?.required;

            return (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.slug} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  {field.name}
                  {isRequired && <span className="text-red-500">*</span>}
                  {isLocalized && (
                    <Globe className="size-3 text-primary/80" title={t('content_entries.translatable_field', 'Çevrilebilir alan')} />
                  )}
                </Label>

                {/* Render based on field type schema */}
                {field.type === 'boolean' ? (
                  <div className="flex items-center pt-1">
                    <Switch
                      id={field.slug}
                      checked={!!val}
                      onCheckedChange={(checked) => handleValueChange(field.slug, checked, activeTab)}
                    />
                  </div>
                ) : field.type === 'text' ? (
                  <RichTextEditor
                    value={val}
                    onChange={(html) => handleValueChange(field.slug, html, activeTab)}
                    placeholder={t('content_entries.dialog.rich_text_placeholder', '{name} girin...').replace('{name}', field.name)}
                  />
                ) : field.type === 'json' ? (
                  <Textarea
                    id={field.slug}
                    value={val}
                    onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
                    placeholder='{"key": "value"}'
                    rows={4}
                    className="font-mono text-xs"
                  />
                ) : field.type === 'integer' || field.type === 'number' ? (
                  <Input
                    id={field.slug}
                    type="number"
                    value={val}
                    onChange={(e) => handleValueChange(field.slug, e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0), activeTab)}
                    placeholder="0"
                  />
                ) : field.type === 'date' ? (
                  <Input
                    id={field.slug}
                    type="date"
                    value={val}
                    onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
                  />
                ) : field.type === 'email' ? (
                  <Input
                    id={field.slug}
                    type="email"
                    value={val}
                    onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
                    placeholder="example@domain.com"
                  />
                ) : field.type === 'phone' ? (
                  <Input
                    id={field.slug}
                    type="tel"
                    value={val}
                    onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
                    placeholder="+90 555 555 55 55"
                  />
                ) : field.type === 'url' ? (
                  <Input
                    id={field.slug}
                    type="url"
                    value={val}
                    onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
                    placeholder="https://example.com"
                  />
                ) : field.type === 'gallery' || field.type === 'media_gallery' ? (
                  <FileUpload
                    value={getMediaIds(val)}
                    onChange={(newVal) => handleValueChange(field.slug, newVal, activeTab)}
                    isMultiple={true}
                    placeholder={`${field.name} eklemek için tıklayın veya sürükleyin`}
                  />
                ) : field.type === 'media' ? (
                  <FileUpload
                    value={getMediaIds(val)}
                    onChange={(newVal) => handleValueChange(field.slug, newVal, activeTab)}
                    isMultiple={false}
                    placeholder={`${field.name} yüklemek için tıklayın veya sürükleyin`}
                  />
                ) : (
                  // Default string/varchar input
                  <Input
                    id={field.slug}
                    type="text"
                    value={val}
                    onChange={(e) => handleValueChange(field.slug, e.target.value, activeTab)}
                    placeholder={`${field.name} girin...`}
                    // Standard auto slugs for main title
                    onBlur={(e) => {
                      if (field.slug === 'title') {
                        const currentSlugVal = isLocalized 
                          ? dataValues.slug?.[activeTab] 
                          : dataValues.slug;
                        if (!currentSlugVal) {
                          const slugified = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9 -]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-');
                          handleValueChange('slug', slugified, activeTab);
                        }
                      }
                    }}
                  />
                )}
              </div>
            );
          })}
        </form>
      )}
    </RightDrawer>
  );
}
