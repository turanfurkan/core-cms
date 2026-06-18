'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash, X, Save, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RightDrawer } from '@/components/common/right-drawer';
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
import { LoaderCircleIcon } from 'lucide-react';

export default function ContentTypeDialog({ open, closeDialog, contentType }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!contentType;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isCollection, setIsCollection] = useState(true);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (open) {
      if (contentType) {
        setName(contentType.name || '');
        setSlug(contentType.slug || '');
        setDescription(contentType.description || '');
        setIsCollection(contentType.is_collection !== false);
        setFields(contentType.fields || []);
      } else {
        setName('');
        setSlug('');
        setDescription('');
        setIsCollection(true);
        // Default base fields standard in CMS
        setFields([
          { name: t('content_types.default_fields.title', 'Title'), slug: 'title', type: 'string', order: 1, validation_rules: { required: true }, options: { localized: true } },
          { name: t('content_types.default_fields.slug', 'Slug'), slug: 'slug', type: 'string', order: 2, validation_rules: { required: true }, options: { localized: true } },
          { name: t('content_types.default_fields.content', 'Content'), slug: 'content', type: 'text', order: 3, validation_rules: { required: false }, options: { localized: true } },
        ]);
      }
    }
  }, [open, contentType, t]);

  // Handle auto slug generation
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!isEdit) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      );
    }
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        name: '',
        slug: '',
        type: 'string',
        order: fields.length + 1,
        validation_rules: { required: false },
        options: { localized: false },
      },
    ]);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const handleFieldChange = (index, key, value) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };

    // Auto-generate field slug if name changes
    if (key === 'name') {
      updated[index].slug = value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_');
    }

    setFields(updated);
  };

  const handleFieldValidationChange = (index, required) => {
    const updated = [...fields];
    updated[index].validation_rules = { ...updated[index].validation_rules, required };
    setFields(updated);
  };

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/content-types/${contentType.id}`
        : '/api/admin/content-types';
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
        throw new Error(errJson.message || 'Failed to save content type');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-types'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? t('content_types.messages.success_edit', 'Content template updated successfully.') : t('content_types.messages.success_add', 'New content template created successfully.')}</AlertTitle>
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
            <AlertTitle>{err.message || t('content_types.messages.error_fallback', 'Action failed.')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error(t('content_types.messages.name_slug_required', 'Template name and slug are required.'));
      return;
    }
    
    // Validate fields list
    const hasEmptyField = fields.some(f => !f.name || !f.slug);
    if (hasEmptyField) {
      toast.error(t('content_types.messages.field_details_required', 'Name and slug must be entered for all fields.'));
      return;
    }

    mutation.mutate({
      name,
      slug,
      description,
      is_collection: isCollection,
      fields: fields.map((f, idx) => ({ ...f, order: idx + 1 })),
    });
  };

  const footerContent = (
    <>
      <Button type="button" variant="outline" onClick={closeDialog}>
        {t('content_types.dialog.cancel', 'Cancel')}
      </Button>
      <Button
        type="submit"
        form="content-type-form"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <LoaderCircleIcon className="size-4 animate-spin mr-1" />
        ) : (
          <Save className="size-4 mr-1" />
        )}
        {t('content_types.dialog.save', 'Save')}
      </Button>
    </>
  );

  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={isEdit ? t('content_types.dialog.edit_title', 'Edit Template') : t('content_types.dialog.add_title', 'New Content Type')}
      size="xl"
      footer={footerContent}
    >
      <form id="content-type-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('content_types.dialog.name_label', 'Template Name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder={t('content_types.dialog.name_placeholder', 'E.g. Blog Post')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">{t('content_types.dialog.slug_label', 'Slug Key')}</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={t('content_types.dialog.slug_placeholder', 'E.g. blog')}
              disabled={isEdit}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">{t('content_types.dialog.description_label', 'Description')}</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('content_types.dialog.description_placeholder', 'What is this template used for?')}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isCollection"
            checked={isCollection}
            onCheckedChange={setIsCollection}
          />
          <Label htmlFor="isCollection">{t('content_types.dialog.is_collection', 'Is Collection? (Allows adding multiple entries)')}</Label>
        </div>

        {/* Dynamic fields builder */}
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold">{t('content_types.dialog.fields_schema', 'Fields Schema')}</h4>
            <Button type="button" variant="dim" size="xs" onClick={handleAddField}>
              <Plus className="size-3 mr-1" /> {t('content_types.dialog.add_field', 'Add Field')}
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-muted/30 p-2.5 rounded-lg border border-border">
                <div className="grid grid-cols-3 gap-2 grow">
                  <Input
                    value={field.name}
                    onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                    placeholder={t('content_types.dialog.field_name_placeholder', 'Field Name (e.g. Price)')}
                    className="h-8 text-xs"
                  />
                  <Input
                    value={field.slug}
                    onChange={(e) => handleFieldChange(idx, 'slug', e.target.value)}
                    placeholder={t('content_types.dialog.field_slug_placeholder', 'Slug (e.g. price)')}
                    className="h-8 text-xs font-mono"
                    disabled={field.slug === 'title' || field.slug === 'slug'}
                  />
                  <Select
                    value={field.type}
                    onValueChange={(val) => handleFieldChange(idx, 'type', val)}
                    disabled={field.slug === 'title' || field.slug === 'slug'}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={t('content_types.dialog.field_type_placeholder', 'Field Type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">{t('content_types.field_types.string', 'Plain Text (string)')}</SelectItem>
                      <SelectItem value="text">{t('content_types.field_types.text', 'Paragraph / Rich Text (text)')}</SelectItem>
                      <SelectItem value="number">{t('content_types.field_types.number', 'Number (number)')}</SelectItem>
                      <SelectItem value="date">{t('content_types.field_types.date', 'Date (date)')}</SelectItem>
                      <SelectItem value="boolean">{t('content_types.field_types.boolean', 'True/False (boolean)')}</SelectItem>
                      <SelectItem value="media">{t('content_types.field_types.media', 'File/Image (media)')}</SelectItem>
                      <SelectItem value="gallery">{t('content_types.field_types.gallery', 'Multiple Media / Gallery (gallery)')}</SelectItem>
                      <SelectItem value="email">{t('content_types.field_types.email', 'Email (email)')}</SelectItem>
                      <SelectItem value="phone">{t('content_types.field_types.phone', 'Phone (phone)')}</SelectItem>
                      <SelectItem value="url">{t('content_types.field_types.url', 'Web Link (url)')}</SelectItem>
                      <SelectItem value="json">{t('content_types.field_types.json', 'JSON / Custom Object (json)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      id={`req-${idx}`}
                      checked={!!field.validation_rules?.required}
                      onChange={(e) => handleFieldValidationChange(idx, e.target.checked)}
                      className="h-3 w-3 rounded text-primary"
                    />
                    <label htmlFor={`req-${idx}`} className="text-[10px] text-muted-foreground select-none">{t('content_types.dialog.required_abbr', 'Req')}</label>
                  </div>

                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      id={`loc-${idx}`}
                      checked={!!field.options?.localized}
                      onChange={(e) => {
                        const updated = [...fields];
                        updated[idx].options = { ...updated[idx].options, localized: e.target.checked };
                        setFields(updated);
                      }}
                      className="h-3 w-3 rounded text-primary"
                    />
                    <label htmlFor={`loc-${idx}`} className="text-[10px] text-muted-foreground select-none">{t('content_types.dialog.localized_abbr', 'Trans')}</label>
                  </div>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveField(idx)}
                    disabled={field.slug === 'title' || field.slug === 'slug'}
                    className="h-7 w-7 p-0 shrink-0"
                  >
                    <Trash className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">{t('content_types.dialog.no_fields', 'No fields defined.')}</p>
            )}
          </div>
        </div>
      </form>
    </RightDrawer>
  );
}
