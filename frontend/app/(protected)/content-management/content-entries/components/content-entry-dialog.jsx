'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon } from 'lucide-react';
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

export default function ContentEntryDialog({ open, closeDialog, contentType, entry }) {
  const queryClient = useQueryClient();
  const isEdit = !!entry;
  const fields = contentType?.fields || [];

  const [dataValues, setDataValues] = useState({});

  useEffect(() => {
    if (open) {
      if (entry) {
        setDataValues(entry.data || {});
      } else {
        const initial = {};
        fields.forEach(f => {
          if (f.type === 'boolean') {
            initial[f.slug] = false;
          } else if (f.type === 'integer' || f.type === 'number') {
            initial[f.slug] = 0;
          } else if (f.type === 'gallery' || f.type === 'media_gallery') {
            initial[f.slug] = [];
          } else {
            initial[f.slug] = '';
          }
        });
        setDataValues(initial);
      }
    }
  }, [open, entry, fields]);

  const handleValueChange = (slug, val) => {
    setDataValues((prev) => ({ ...prev, [slug]: val }));
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
      const val = dataValues[field.slug];
      if (isRequired && (val === undefined || val === null || val === '')) {
        toast.custom(
          () => (
            <Alert variant="mono" icon="destructive" close={false}>
              <AlertIcon>
                <RiErrorWarningFill />
              </AlertIcon>
              <AlertTitle>{`"${field.name}" alanı zorunludur.`}</AlertTitle>
            </Alert>
          ),
          { position: 'top-center' }
        );
        return;
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
        İptal
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
        Kaydet
      </Button>
    </>
  );

  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={`${isEdit ? 'İçerik Düzenle' : 'Yeni İçerik Girişi'} (${contentType.name})`}
      size="3xl"
      footer={footerContent}
    >
      <form id="content-entry-form" onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => {
          const val = dataValues[field.slug] ?? '';
          const isRequired = !!field.validation_rules?.required;

          return (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.slug} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                {field.name}
                {isRequired && <span className="text-red-500">*</span>}
              </Label>

              {/* Render based on field type schema */}
              {field.type === 'boolean' ? (
                <div className="flex items-center pt-1">
                  <Switch
                    id={field.slug}
                    checked={!!val}
                    onCheckedChange={(checked) => handleValueChange(field.slug, checked)}
                  />
                </div>
              ) : field.type === 'text' ? (
                <RichTextEditor
                  value={val}
                  onChange={(html) => handleValueChange(field.slug, html)}
                  placeholder={`${field.name} girin...`}
                />
              ) : field.type === 'json' ? (
                <textarea
                  id={field.slug}
                  value={val}
                  onChange={(e) => handleValueChange(field.slug, e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
                />
              ) : field.type === 'integer' || field.type === 'number' ? (
                <Input
                  id={field.slug}
                  type="number"
                  value={val}
                  onChange={(e) => handleValueChange(field.slug, e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                />
              ) : field.type === 'date' ? (
                <Input
                  id={field.slug}
                  type="date"
                  value={val}
                  onChange={(e) => handleValueChange(field.slug, e.target.value)}
                />
              ) : field.type === 'email' ? (
                <Input
                  id={field.slug}
                  type="email"
                  value={val}
                  onChange={(e) => handleValueChange(field.slug, e.target.value)}
                  placeholder="example@domain.com"
                />
              ) : field.type === 'phone' ? (
                <Input
                  id={field.slug}
                  type="tel"
                  value={val}
                  onChange={(e) => handleValueChange(field.slug, e.target.value)}
                  placeholder="+90 555 555 55 55"
                />
              ) : field.type === 'url' ? (
                <Input
                  id={field.slug}
                  type="url"
                  value={val}
                  onChange={(e) => handleValueChange(field.slug, e.target.value)}
                  placeholder="https://example.com"
                />
              ) : field.type === 'gallery' || field.type === 'media_gallery' ? (
                <FileUpload
                  value={val}
                  onChange={(newVal) => handleValueChange(field.slug, newVal)}
                  isMultiple={true}
                  placeholder={`${field.name} eklemek için tıklayın veya sürükleyin`}
                />
              ) : field.type === 'media' ? (
                <FileUpload
                  value={val}
                  onChange={(newVal) => handleValueChange(field.slug, newVal)}
                  isMultiple={false}
                  placeholder={`${field.name} yüklemek için tıklayın veya sürükleyin`}
                />
              ) : (
                // Default string/varchar input
                <Input
                  id={field.slug}
                  type="text"
                  value={val}
                  onChange={(e) => handleValueChange(field.slug, e.target.value)}
                  placeholder={`${field.name} girin...`}
                  // Standard auto slugs for main title
                  onBlur={(e) => {
                    if (field.slug === 'title' && !dataValues.slug) {
                      handleValueChange(
                        'slug',
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9 -]/g, '')
                          .replace(/\s+/g, '-')
                          .replace(/-+/g, '-')
                      );
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </form>
    </RightDrawer>
  );
}
