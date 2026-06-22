'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Trash, 
  X, 
  Save, 
  Check, 
  Settings, 
  Database, 
  FileText, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight, 
  ArrowLeft, 
  Grid, 
  Globe, 
  Settings2,
  ListPlus,
  Link2,
  Sliders,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RightDrawer } from '@/components/common/right-drawer';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const ICONS_LIST = [
  'Database', 'FileText', 'Globe', 'Sliders', 'Eye', 'Link2', 'Settings2', 'Sparkles'
];

const COLORS_LIST = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Yellow', hex: '#f59e0b' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Slate', hex: '#64748b' }
];

export default function ContentTypeDialog({ open, closeDialog, contentType }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!contentType?.id;

  // Fetch content types to populate relations targets
  const { data: contentTypesList } = useQuery({
    queryKey: ['admin-content-types'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/content-types');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Wizard Steps: 1 = Genel Bilgiler, 2 = Alan Şeması (Field Builder), 3 = Gelişmiş Ayarlar
  const [step, setStep] = useState(1);

  // Step 1 Form States
  const [name, setName] = useState('');
  const [apiIdentifier, setApiIdentifier] = useState('');
  const [description, setDescription] = useState('');
  const [isCollection, setIsCollection] = useState(true);
  
  // Accordion & Appearance settings states
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [icon, setIcon] = useState('Database');
  const [color, setColor] = useState('#3b82f6');
  
  // Step 3 Features Settings States
  const [draftPublish, setDraftPublish] = useState(true);
  const [versionHistory, setVersionHistory] = useState(true);
  const [scheduledPublishing, setScheduledPublishing] = useState(false);
  const [revisionRollback, setRevisionRollback] = useState(false);

  // Localization States
  const [enableLocalization, setEnableLocalization] = useState(false);
  const [defaultLang, setDefaultLang] = useState('tr');
  const [supportedLangs, setSupportedLangs] = useState(['tr']);

  // Permissions States
  const [allowedRoles, setAllowedRoles] = useState(['admin', 'editor']);

  // Preview URL Desteği
  const [previewUrlPattern, setPreviewUrlPattern] = useState('');

  // SEO Package State
  const [seoEnabled, setSeoEnabled] = useState(false);

  // Step 2 Fields Schema list
  const [fields, setFields] = useState([]);

  // Sub-dialogs and Drawer states
  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false);
  const [fieldSettingsIndex, setFieldSettingsIndex] = useState(null); 
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [activeTabFieldModal, setActiveTabFieldModal] = useState('basic');

  // Load/Pre-populate data
  useEffect(() => {
    if (open) {
      setStep(1);
      setAppearanceOpen(false);
      if (contentType) {
        setName(contentType.name || '');
        setApiIdentifier(contentType.slug || '');
        setDescription(contentType.description || '');
        setIsCollection(contentType.is_collection !== false);
        setFields(contentType.fields || []);
        
        // Settings mapping
        const settings = contentType.settings || {};
        setIcon(settings.icon || 'Database');
        setColor(settings.color || '#3b82f6');
        setSeoEnabled(!!settings.seo_enabled);
        setPreviewUrlPattern(settings.preview_url_pattern || '');

        // Localization mapping
        const loc = settings.localization || {};
        setEnableLocalization(!!loc.enabled);
        setDefaultLang(loc.default_lang || 'tr');
        setSupportedLangs(loc.supported_langs || ['tr']);

        // Permissions mapping
        const perm = settings.permissions || {};
        setAllowedRoles(perm.roles || ['admin', 'editor']);

        // Features mapping
        const feats = settings.features || {};
        setDraftPublish(feats.draft_publish !== false);
        setVersionHistory(feats.version_history !== false);
        setScheduledPublishing(!!feats.scheduled_publishing);
        setRevisionRollback(!!feats.revision_rollback);
      } else {
        setName('');
        setApiIdentifier('');
        setDescription('');
        setIsCollection(true);
        setIcon('Database');
        setColor('#3b82f6');
        setSeoEnabled(false);
        setPreviewUrlPattern('');
        setEnableLocalization(false);
        setDefaultLang('tr');
        setSupportedLangs(['tr']);
        setAllowedRoles(['admin', 'editor']);
        setDraftPublish(true);
        setVersionHistory(true);
        setScheduledPublishing(false);
        setRevisionRollback(false);

        // Standard default locked fields
        setFields([
          { name: t('content_types.default_fields.title', 'Title'), slug: 'title', type: 'string', order: 1, validation_rules: { required: true }, options: { localized: true } },
          { name: t('content_types.default_fields.slug', 'Slug'), slug: 'slug', type: 'string', order: 2, validation_rules: { required: true }, options: { localized: true } },
        ]);
      }
    }
  }, [open, contentType, t]);

  // Handle Name field updates and auto API ID generation
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!isEdit) {
      setApiIdentifier(
        val
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/[-\s]+/g, '_')
          .replace(/_+/g, '_')
      );
    }
  };

  // Field schema movement helpers
  const moveField = (index, direction) => {
    if (direction === 'up' && index > 2) { 
      const updated = [...fields];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      setFields(updated);
    } else if (direction === 'down' && index >= 2 && index < fields.length - 1) {
      const updated = [...fields];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      setFields(updated);
    }
  };

  const removeField = (index) => {
    if (index >= 2) {
      setFields(fields.filter((_, idx) => idx !== index));
    }
  };

  const addFieldType = (label, type, categoryOptions = {}) => {
    const isRelation = type === 'relation';
    const initialSlug = `new_${type}_${Date.now().toString().slice(-4)}`;
    
    const newField = {
      name: `New ${label}`,
      slug: initialSlug,
      type: isRelation ? 'string' : type,
      validation_rules: { required: false },
      options: {
        field_type: label,
        localized: false,
        ...categoryOptions
      },
      order: fields.length + 1
    };

    setFields([...fields, newField]);
    setAddFieldModalOpen(false);
    
    setTimeout(() => {
      setFieldSettingsIndex(fields.length);
      setSettingsDrawerOpen(true);
    }, 150);
  };

  const isLockedField = (field) => {
    return field.slug === 'title' || field.slug === 'slug';
  };

  // Mutation logic
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/content-types/${contentType.id}`
        : '/api/admin/content-types';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
            <AlertTitle>
              {isEdit 
                ? t('content_types.messages.success_edit', 'Content template updated successfully.') 
                : t('content_types.messages.success_add', 'New content template created successfully.')
              }
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
            <AlertTitle>{err.message || t('content_types.messages.error_fallback', 'Action failed.')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!name || !apiIdentifier) {
      toast.error('Template name and API Identifier are required.');
      return;
    }
    
    const hasEmptyField = fields.some(f => !f.name || !f.slug);
    if (hasEmptyField) {
      toast.error(t('content_types.messages.field_details_required', 'Name and slug must be entered for all fields.'));
      return;
    }

    let finalFields = [...fields];
    if (seoEnabled) {
      const seoDefinitions = [
        { name: 'SEO Title', slug: 'seo_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
        { name: 'SEO Description', slug: 'seo_description', type: 'text', validation_rules: { required: false }, options: { localized: true } },
        { name: 'Canonical URL', slug: 'canonical_url', type: 'url', validation_rules: { required: false }, options: { localized: false } },
        { name: 'OG Title', slug: 'og_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
        { name: 'OG Description', slug: 'og_description', type: 'text', validation_rules: { required: false }, options: { localized: true } },
        { name: 'OG Image', slug: 'og_image', type: 'media', validation_rules: { required: false }, options: { localized: false } },
        { name: 'Robots Meta', slug: 'robots_meta', type: 'string', validation_rules: { required: false }, options: { localized: false } },
      ];

      seoDefinitions.forEach((def) => {
        if (!finalFields.some((f) => f.slug === def.slug)) {
          finalFields.push({
            ...def,
            order: finalFields.length + 1
          });
        }
      });
    }

    const payload = {
      name,
      slug: apiIdentifier,
      description,
      is_collection: isCollection,
      settings: {
        icon,
        color,
        seo_enabled: seoEnabled,
        preview_url_pattern: previewUrlPattern,
        localization: {
          enabled: enableLocalization,
          default_lang: defaultLang,
          supported_langs: supportedLangs
        },
        permissions: {
          roles: allowedRoles
        },
        features: {
          draft_publish: draftPublish,
          version_history: versionHistory,
          scheduled_publishing: scheduledPublishing,
          revision_rollback: revisionRollback
        }
      },
      fields: finalFields.map((f, idx) => ({ ...f, order: idx + 1 }))
    };

    mutation.mutate(payload);
  };

  // Step Navigations
  const handleNextStep = () => {
    if (step === 1) {
      if (!name || !apiIdentifier) {
        toast.error('İçerik Şablonu Adı ve API Identifier alanları zorunludur.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const hasEmptyField = fields.some(f => !f.name || !f.slug);
      if (hasEmptyField) {
        toast.error('Tüm alanların adı ve anahtarı girilmelidir.');
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Stepper Footers
  const footerContent = (
    <div className="flex justify-between items-center w-full">
      {step > 1 ? (
        <Button type="button" variant="outline" onClick={handlePrevStep} className="gap-1.5 h-9 rounded-lg">
          <ArrowLeft className="size-4" />
          Geri
        </Button>
      ) : (
        <span />
      )}
      
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={closeDialog} className="h-9 rounded-lg">
          İptal
        </Button>

        {step < 3 ? (
          <Button type="button" onClick={handleNextStep} className="gap-1.5 h-9 rounded-lg">
            İleri
            <ArrowRight className="size-4" />
          </Button>
        ) : (
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
        )}
      </div>
    </div>
  );

  // Settings sub-drawer fields mapper
  const currentSettingsField = fields[fieldSettingsIndex] || null;

  const handleUpdateSettingsField = (key, value) => {
    const updated = [...fields];
    updated[fieldSettingsIndex] = { ...updated[fieldSettingsIndex], [key]: value };
    if (key === 'name' && !isLockedField(updated[fieldSettingsIndex])) {
      updated[fieldSettingsIndex].slug = value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_');
    }
    setFields(updated);
  };

  const handleUpdateSettingsOptions = (optKey, value) => {
    const updated = [...fields];
    const prevOpts = updated[fieldSettingsIndex].options || {};
    updated[fieldSettingsIndex].options = { ...prevOpts, [optKey]: value };
    setFields(updated);
  };

  const handleUpdateSettingsValidation = (valKey, value) => {
    const updated = [...fields];
    const prevVal = updated[fieldSettingsIndex].validation_rules || {};
    updated[fieldSettingsIndex].validation_rules = { ...prevVal, [valKey]: value };
    setFields(updated);
  };

  return (
    <>
      <RightDrawer
        open={open}
        onOpenChange={closeDialog}
        title={isEdit ? `İçerik Şablonu: ${name}` : 'İçerik Şablonu Oluştur'}
        size="3xl"
        footer={footerContent}
      >
        {/* Progress header wizard */}
        <div className="flex items-center justify-center border-b border-border pb-5 mb-5 select-none">
          <div className="flex items-center gap-3">
            <span className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 1 ? 'bg-primary text-white scale-110 shadow-sm' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </span>
            <span className={`text-xs font-bold ${step === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Genel Bilgiler
            </span>

            <span className="h-px w-8 bg-border mx-1" />

            <span className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 2 ? 'bg-primary text-white scale-110 shadow-sm' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </span>
            <span className={`text-xs font-bold ${step === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Alan Şeması
            </span>

            <span className="h-px w-8 bg-border mx-1" />

            <span className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 3 ? 'bg-primary text-white scale-110 shadow-sm' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </span>
            <span className={`text-xs font-bold ${step === 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Gelişmiş Ayarlar
            </span>
          </div>
        </div>

        {/* STEP 1: Genel Bilgiler */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-4 bg-muted/10 p-5 rounded-2xl border border-border/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Temel Bilgiler</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="type-name">İçerik Tipi Adı</Label>
                  <Input
                    id="type-name"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Örn: Blog Yazıları"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type-api">API Identifier</Label>
                  <Input
                    id="type-api"
                    value={apiIdentifier}
                    onChange={(e) => setApiIdentifier(e.target.value)}
                    placeholder="Örn: blog_posts"
                    disabled={isEdit}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type-desc">Açıklama</Label>
                <Textarea
                  id="type-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="İçeriklerin yönetimi için şablon açıklaması..."
                  rows={2}
                />
              </div>
            </div>

            {/* Collection/Single Type Selector (clean radio cards) */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground">İçerik Tipi Yapısı</Label>
              <div className="grid grid-cols-2 gap-4">
                <label 
                  className={`border border-border p-4 rounded-xl cursor-pointer hover:bg-muted/10 flex items-start gap-3 transition-all ${
                    isCollection ? 'border-primary bg-primary/5' : 'bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="structure-type"
                    checked={isCollection}
                    onChange={() => setIsCollection(true)}
                    className="rounded-full text-primary border-border focus:ring-primary size-4 mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-sm text-foreground block">Collection Type</span>
                    <span className="text-[10px] text-muted-foreground leading-relaxed block mt-0.5">
                      Birden fazla içerik girişi oluşturulabilir (Örn: Bloglar, Ürünler, Haberler).
                    </span>
                  </div>
                </label>

                <label 
                  className={`border border-border p-4 rounded-xl cursor-pointer hover:bg-muted/10 flex items-start gap-3 transition-all ${
                    !isCollection ? 'border-primary bg-primary/5' : 'bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="structure-type"
                    checked={!isCollection}
                    onChange={() => setIsCollection(false)}
                    className="rounded-full text-primary border-border focus:ring-primary size-4 mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-sm text-foreground block">Single Type</span>
                    <span className="text-[10px] text-muted-foreground leading-relaxed block mt-0.5">
                      Tek bir içerik girişi oluşturulabilir (Örn: Hakkımızda, İletişim, Ana Sayfa).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Collapsible Appearance Customizer */}
            <Accordion type="single" collapsible variant="outline" className="w-full bg-card">
              <AccordionItem value="appearance" className="border-none px-4 py-0">
                <AccordionTrigger className="font-bold text-xs text-muted-foreground hover:text-foreground py-3 border-none flex items-center justify-between shrink-0">
                  Görünüm Özelleştirme
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-0 border-t border-border mt-1">
                  <div className="space-y-4 pt-4">
                    {/* Icon choice grid */}
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Şablon Simgesi</Label>
                      <div className="flex gap-2 flex-wrap">
                        {ICONS_LIST.map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setIcon(ic)}
                            className={`p-2 rounded-lg border transition-all ${
                              icon === ic ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Database className="size-4" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color selection circles */}
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Renk Teması</Label>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS_LIST.map((col) => (
                          <button
                            key={col.hex}
                            type="button"
                            onClick={() => setColor(col.hex)}
                            className={`size-6 rounded-full border-2 transition-all ${
                              color === col.hex ? 'border-foreground scale-110 shadow-sm' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: col.hex }}
                            title={col.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* STEP 2: Alan Şeması (Field Builder) */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold">Alan Şeması (Fields Schema)</h4>
                <p className="text-xs text-muted-foreground">Şablon alanlarını oluşturun ve sıralayın.</p>
              </div>
              <Button type="button" size="sm" onClick={() => setAddFieldModalOpen(true)} className="gap-1.5 h-8">
                <ListPlus className="size-4" /> Alan Ekle
              </Button>
            </div>

            {/* List of Fields */}
            <div className="space-y-3">
              {fields.map((field, idx) => {
                const isLocked = isLockedField(field);
                const fieldLabel = field.options?.field_type || field.type;

                return (
                  <div 
                    key={idx} 
                    className={`bg-card border p-4 rounded-xl flex items-center justify-between hover:shadow-sm transition-all group ${
                      isLocked ? 'border-border bg-muted/10' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-muted-foreground ${isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-grab hover:text-foreground'}`}>
                        <Grid className="size-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{field.name || 'İsimsiz Alan'}</span>
                          <code className="text-[10px] text-muted-foreground font-mono">({field.slug || 'no-slug'})</code>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                          <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">
                            {fieldLabel}
                          </Badge>
                          {field.validation_rules?.required && (
                            <Badge variant="warning" className="text-[9px] font-bold px-1.5 py-0">Zorunlu</Badge>
                          )}
                          {field.options?.localized && (
                            <Badge variant="info" className="text-[9px] font-bold px-1.5 py-0">Çeviri</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Move up */}
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={() => moveField(idx, 'up')}
                        disabled={idx <= 2 || isLocked}
                        className="h-7 w-7 p-0 rounded-lg"
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      
                      {/* Move down */}
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={() => moveField(idx, 'down')}
                        disabled={idx === fields.length - 1 || isLocked}
                        className="h-7 w-7 p-0 rounded-lg"
                      >
                        <ChevronDown className="size-4" />
                      </Button>

                      {/* Settings Cog */}
                      <Button 
                        type="button"
                        variant="dim" 
                        size="sm" 
                        onClick={() => {
                          setFieldSettingsIndex(idx);
                          setSettingsDrawerOpen(true);
                        }}
                        className="h-7 w-7 p-0 rounded-lg"
                      >
                        <Settings className="size-4" />
                      </Button>

                      {/* Delete */}
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeField(idx)}
                        disabled={isLocked}
                        className="h-7 w-7 p-0 rounded-lg"
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Gelişmiş Ayarlar */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Yayınlama ve Sürüm Yönetimi */}
            <div className="space-y-3 p-5 border border-border rounded-xl bg-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                Yayınlama ve Sürüm Yönetimi
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 cursor-pointer p-4 border border-border rounded-xl bg-card hover:bg-muted/5 [&:has([data-state=checked])]:border-primary/50">
                  <Checkbox
                    id="draftPublish"
                    checked={draftPublish}
                    onCheckedChange={(checked) => setDraftPublish(!!checked)}
                    className="mt-0.5"
                  />
                  <label htmlFor="draftPublish" className="cursor-pointer select-none">
                    <span className="text-xs font-bold text-foreground block">Draft & Publish</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      İçeriklerinizi yayınlamadan önce taslak olarak kaydedilmesine izin verin.
                    </span>
                  </label>
                </div>

                <div className="flex items-start gap-3 cursor-pointer p-4 border border-border rounded-xl bg-card hover:bg-muted/5 [&:has([data-state=checked])]:border-primary/50">
                  <Checkbox
                    id="versionHistory"
                    checked={versionHistory}
                    onCheckedChange={(checked) => setVersionHistory(!!checked)}
                    className="mt-0.5"
                  />
                  <label htmlFor="versionHistory" className="cursor-pointer select-none">
                    <span className="text-xs font-bold text-foreground block">Version History</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      İçerik üzerinde yapılan her değişikliği yeni bir sürüm olarak izleyin.
                    </span>
                  </label>
                </div>

                <div className="flex items-start gap-3 cursor-pointer p-4 border border-border rounded-xl bg-card hover:bg-muted/5 [&:has([data-state=checked])]:border-primary/50">
                  <Checkbox
                    id="scheduledPublishing"
                    checked={scheduledPublishing}
                    onCheckedChange={(checked) => setScheduledPublishing(!!checked)}
                    className="mt-0.5"
                  />
                  <label htmlFor="scheduledPublishing" className="cursor-pointer select-none">
                    <span className="text-xs font-bold text-foreground block">Scheduled Publishing</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      İçeriklerin gelecek bir saat ve tarihte otomatik olarak yayınlanmasını sağlayın.
                    </span>
                  </label>
                </div>

                <div className="flex items-start gap-3 cursor-pointer p-4 border border-border rounded-xl bg-card hover:bg-muted/5 [&:has([data-state=checked])]:border-primary/50">
                  <Checkbox
                    id="revisionRollback"
                    checked={revisionRollback}
                    onCheckedChange={(checked) => setRevisionRollback(!!checked)}
                    className="mt-0.5"
                  />
                  <label htmlFor="revisionRollback" className="cursor-pointer select-none">
                    <span className="text-xs font-bold text-foreground block">Revision Rollback</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      İçeriği geçmişteki herhangi bir sürüme tek tıkla geri yüklemeyi aktif edin.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Çoklu Dil Desteği */}
            <div className="space-y-4 p-5 border border-border rounded-xl bg-card">
              <div className="flex items-center justify-between border-b border-border pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Çoklu Dil Desteği
                </h4>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="loc-enable"
                    checked={enableLocalization}
                    onCheckedChange={setEnableLocalization}
                  />
                  <Label htmlFor="loc-enable" className="text-xs font-bold cursor-pointer">Aktif Et</Label>
                </div>
              </div>

              {enableLocalization && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Varsayılan Dil</Label>
                    <Select value={defaultLang} onValueChange={setDefaultLang}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Dil seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">İngilizce</SelectItem>
                        <SelectItem value="ar">Arapça</SelectItem>
                        <SelectItem value="ru">Rusça</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Desteklenen Diller</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['tr', 'en', 'ar', 'ru'].map((langCode) => {
                        const langNames = { tr: 'Türkçe', en: 'İngilizce', ar: 'Arapça', ru: 'Rusça' };
                        const isChecked = supportedLangs.includes(langCode);
                        return (
                          <div key={langCode} className="flex items-center gap-2 text-xs cursor-pointer p-2.5 border border-border rounded-lg bg-card hover:bg-muted/10 [&:has([data-state=checked])]:border-primary/50">
                            <Checkbox
                              id={`lang-${langCode}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSupportedLangs([...supportedLangs, langCode]);
                                } else {
                                  setSupportedLangs(supportedLangs.filter(l => l !== langCode));
                                }
                              }}
                            />
                            <label htmlFor={`lang-${langCode}`} className="cursor-pointer select-none text-xs font-semibold">
                              {langNames[langCode]}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Yetkilendirme (Permissions) */}
            <div className="space-y-3 p-5 border border-border rounded-xl bg-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1 flex items-center gap-1.5">
                <ShieldCheck className="size-4" />
                Yetkilendirme
              </h4>
              <p className="text-[10px] text-muted-foreground">Bu içerik tipini hangi kullanıcı rollerinin yönetebileceğini seçin.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {['admin', 'editor', 'author', 'moderator'].map((role) => {
                  const roleLabel = { admin: 'Admin', editor: 'Editor', author: 'Author', moderator: 'Moderator' };
                  const isChecked = allowedRoles.includes(role);
                  return (
                    <div key={role} className="flex items-center gap-2 text-xs cursor-pointer p-2.5 border border-border rounded-xl bg-card hover:bg-muted/10 [&:has([data-state=checked])]:border-primary/50">
                      <Checkbox
                        id={`role-${role}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAllowedRoles([...allowedRoles, role]);
                          } else {
                            setAllowedRoles(allowedRoles.filter(r => r !== role));
                          }
                        }}
                      />
                      <label htmlFor={`role-${role}`} className="cursor-pointer select-none text-xs font-semibold">
                        {roleLabel[role]}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview URL Desteği */}
            <div className="space-y-3 p-5 border border-border rounded-xl bg-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                Önizleme (Preview URL)
              </h4>
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="preview-url-input">Preview URL Pattern</Label>
                <Input
                  id="preview-url-input"
                  value={previewUrlPattern}
                  onChange={(e) => setPreviewUrlPattern(e.target.value)}
                  placeholder="https://example.com/preview/{slug}"
                />
                <span className="text-[10px] text-muted-foreground">
                  Headless frontend entegrasyonu için dinamik önizleme adresi. `{'{slug}'}` değişkeni içerik slug değeriyle değiştirilecektir.
                </span>
              </div>
            </div>

            {/* SEO Optimizasyon Paketi */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-primary/5">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="size-4" />
                  SEO Optimizasyon Paketi
                </span>
                <span className="text-[10px] text-muted-foreground block max-w-md">
                  SEO Title, SEO Description, Canonical URL, OG Title, OG Description, OG Image ve Robots Meta alan grubunu şablona otomatik olarak ekler.
                </span>
              </div>
              <Switch id="seo-pack" checked={seoEnabled} onCheckedChange={setSeoEnabled} />
            </div>
          </div>
        )}
      </RightDrawer>

      {/* Field Addition categories modal */}
      <Dialog open={addFieldModalOpen} onOpenChange={setAddFieldModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-5 border-b border-border mb-0 flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-base font-bold">Yeni Alan Ekle</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex-1 flex flex-col overflow-hidden p-0">
            <Tabs value={activeTabFieldModal} onValueChange={setActiveTabFieldModal} className="flex-1 flex flex-col overflow-hidden">
              <TabsList variant="line" size="sm" className="px-6 border-b border-border shrink-0 overflow-x-auto justify-start bg-transparent">
                <TabsTrigger value="basic">Temel Alanlar</TabsTrigger>
                <TabsTrigger value="choice">Seçimler</TabsTrigger>
                <TabsTrigger value="media">Medya</TabsTrigger>
                <TabsTrigger value="advanced">Gelişmiş</TabsTrigger>
                <TabsTrigger value="structure">Yapısal</TabsTrigger>
                <TabsTrigger value="relations">İlişkiler</TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-y-auto p-6">
                <TabsContent value="basic" className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-0">
                  <div onClick={() => addFieldType('Text', 'string')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Plain Text</span>
                    <span className="text-[10px] text-muted-foreground block">Tek satırlık düz metin</span>
                  </div>
                  <div onClick={() => addFieldType('Textarea', 'text')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Long Text</span>
                    <span className="text-[10px] text-muted-foreground block">Çok satırlı açıklama alanı</span>
                  </div>
                  <div onClick={() => addFieldType('Rich Text', 'text', { editor: 'rich-text' })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Rich Text</span>
                    <span className="text-[10px] text-muted-foreground block">Formatlı WYSIWYG metin editörü</span>
                  </div>
                  <div onClick={() => addFieldType('Number', 'number')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Number</span>
                    <span className="text-[10px] text-muted-foreground block">Tam sayı girdisi</span>
                  </div>
                  <div onClick={() => addFieldType('Decimal', 'number', { format: 'decimal' })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Decimal</span>
                    <span className="text-[10px] text-muted-foreground block">Ondalıklı sayı girdisi</span>
                  </div>
                  <div onClick={() => addFieldType('Boolean', 'boolean')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Boolean</span>
                    <span className="text-[10px] text-muted-foreground block">True/False Switch seçimi</span>
                  </div>
                  <div onClick={() => addFieldType('Date', 'date')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Date</span>
                    <span className="text-[10px] text-muted-foreground block">Tarih seçici</span>
                  </div>
                  <div onClick={() => addFieldType('Datetime', 'datetime')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Datetime</span>
                    <span className="text-[10px] text-muted-foreground block">Tarih ve Saat seçici</span>
                  </div>
                  <div onClick={() => addFieldType('Time', 'time')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Time</span>
                    <span className="text-[10px] text-muted-foreground block">Saat seçici</span>
                  </div>
                  <div onClick={() => addFieldType('Email', 'email')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Email</span>
                    <span className="text-[10px] text-muted-foreground block">E-Posta adresi doğrulamalı</span>
                  </div>
                  <div onClick={() => addFieldType('Phone', 'phone')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Phone</span>
                    <span className="text-[10px] text-muted-foreground block">Telefon numarası formatı</span>
                  </div>
                  <div onClick={() => addFieldType('URL', 'url')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">URL Link</span>
                    <span className="text-[10px] text-muted-foreground block">Web adresi köprü linki</span>
                  </div>
                </TabsContent>
                <TabsContent value="choice" className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-0">
                  <div onClick={() => addFieldType('Select', 'string', { input: 'select', choices: [] })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Dropdown Select</span>
                    <span className="text-[10px] text-muted-foreground block">Açılır listeden tek seçim</span>
                  </div>
                  <div onClick={() => addFieldType('Multi Select', 'json', { input: 'multi_select', choices: [] })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Multi Select</span>
                    <span className="text-[10px] text-muted-foreground block">Birden fazla değer seçimi</span>
                  </div>
                  <div onClick={() => addFieldType('Radio', 'string', { input: 'radio', choices: [] })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Radio List</span>
                    <span className="text-[10px] text-muted-foreground block">Seçeneklerden tekini işaretleme</span>
                  </div>
                  <div onClick={() => addFieldType('Checkbox', 'json', { input: 'checkbox', choices: [] })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Checkboxes</span>
                    <span className="text-[10px] text-muted-foreground block">Çoklu kutu işaretleme listesi</span>
                  </div>
                </TabsContent>
                <TabsContent value="media" className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-0">
                  <div onClick={() => addFieldType('Image', 'media', { subtype: 'image' })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Image Asset</span>
                    <span className="text-[10px] text-muted-foreground block">Kütüphaneden tek görsel</span>
                  </div>
                  <div onClick={() => addFieldType('Gallery', 'gallery')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Gallery</span>
                    <span className="text-[10px] text-muted-foreground block">Çoklu fotoğraf galerisi</span>
                  </div>
                  <div onClick={() => addFieldType('File', 'media', { subtype: 'file' })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Document / File</span>
                    <span className="text-[10px] text-muted-foreground block">PDF, Zip, Belge yükleme</span>
                  </div>
                </TabsContent>
                <TabsContent value="advanced" className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-0">
                  <div onClick={() => addFieldType('JSON', 'json')} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">JSON Editor</span>
                    <span className="text-[10px] text-muted-foreground block">Ham JSON verisi saklama</span>
                  </div>
                  <div onClick={() => addFieldType('Markdown', 'text', { editor: 'markdown' })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Markdown</span>
                    <span className="text-[10px] text-muted-foreground block">Markdown formatında içerik girişi</span>
                  </div>
                  <div onClick={() => addFieldType('Code Editor', 'text', { editor: 'code-editor' })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Code Editor</span>
                    <span className="text-[10px] text-muted-foreground block">HTML, CSS, JS kod giriş alanı</span>
                  </div>
                  <div onClick={() => addFieldType('Color Picker', 'string', { editor: 'color-picker' })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Color Picker</span>
                    <span className="text-[10px] text-muted-foreground block">Renk kodu hex seçimi</span>
                  </div>
                </TabsContent>
                <TabsContent value="structure" className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-0">
                  <div onClick={() => addFieldType('Repeater', 'json', { structure: 'repeater', fields: [] })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Repeater</span>
                    <span className="text-[10px] text-muted-foreground block">Tekrarlanabilir alan grupları (Örn: SSS)</span>
                  </div>
                  <div onClick={() => addFieldType('Component', 'json', { structure: 'component', component_name: '' })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Component</span>
                    <span className="text-[10px] text-muted-foreground block">Tekrar kullanılabilir hazır blok yapısı</span>
                  </div>
                  <div onClick={() => addFieldType('Dynamic Zone', 'json', { structure: 'dynamic_zone', allowed_components: [] })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">Dynamic Zone</span>
                    <span className="text-[10px] text-muted-foreground block">Editörün dinamik blok seçip sayfa kurmasını sağlar</span>
                  </div>
                </TabsContent>
                <TabsContent value="relations" className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-0">
                  <div onClick={() => addFieldType('Relation', 'relation', { relation_type: 'one-to-one', target_content_type: '' })} className="border p-3.5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                    <span className="font-bold text-xs block text-foreground">İlişkisel Alan (Relation)</span>
                    <span className="text-[10px] text-muted-foreground block">Diğer şablonlar ile bağlantı kurma (Örn: Yazar, Kategori)</span>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Field Settings Sub-Drawer */}
      {settingsDrawerOpen && currentSettingsField && (
        <RightDrawer
          open={settingsDrawerOpen}
          onOpenChange={setSettingsDrawerOpen}
          title={`Alan Ayarları: ${currentSettingsField.name || 'Yeni Alan'}`}
          size="lg"
          footer={
            <Button type="button" onClick={() => setSettingsDrawerOpen(false)} className="h-9 rounded-lg">
              <Check className="size-4 mr-1.5" /> Ayarları Uygula
            </Button>
          }
        >
          <div className="space-y-6">
            {/* General Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Genel Bilgiler</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Etiket (Label)</Label>
                  <Input
                    value={currentSettingsField.name}
                    onChange={(e) => handleUpdateSettingsField('name', e.target.value)}
                    placeholder="Alan Etiketi"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Veritabanı Anahtarı (Key / Slug)</Label>
                  <Input
                    value={currentSettingsField.slug}
                    onChange={(e) => handleUpdateSettingsField('slug', e.target.value)}
                    placeholder="alan_anahtari"
                    disabled={isLockedField(currentSettingsField)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Placeholder / İpucu</Label>
                <Input
                  value={currentSettingsField.options?.placeholder || ''}
                  onChange={(e) => handleUpdateSettingsOptions('placeholder', e.target.value)}
                  placeholder="Kullanıcıya yardımcı metin girin..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Yardım Açıklaması (Help Text)</Label>
                <Input
                  value={currentSettingsField.options?.help_text || ''}
                  onChange={(e) => handleUpdateSettingsOptions('help_text', e.target.value)}
                  placeholder="Giriş kutusunun altında gösterilir..."
                />
              </div>
            </div>

            {/* Validation Rules */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Validasyon Kuralları</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="val-req" 
                    checked={!!currentSettingsField.validation_rules?.required} 
                    onCheckedChange={(val) => handleUpdateSettingsValidation('required', val)}
                  />
                  <Label htmlFor="val-req" className="cursor-pointer">Zorunlu Alan (Required)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="val-uniq" 
                    checked={!!currentSettingsField.validation_rules?.unique} 
                    onCheckedChange={(val) => handleUpdateSettingsValidation('unique', val)}
                    disabled={isLockedField(currentSettingsField)}
                  />
                  <Label htmlFor="val-uniq" className="cursor-pointer">Benzersiz Olsun (Unique)</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Min Değer / Karakter</Label>
                  <Input
                    type="number"
                    value={currentSettingsField.validation_rules?.min_length || ''}
                    onChange={(e) => handleUpdateSettingsValidation('min_length', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="örn: 5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Değer / Karakter</Label>
                  <Input
                    type="number"
                    value={currentSettingsField.validation_rules?.max_length || ''}
                    onChange={(e) => handleUpdateSettingsValidation('max_length', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="örn: 255"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Regex Deseni</Label>
                <Input
                  value={currentSettingsField.validation_rules?.regex || ''}
                  onChange={(e) => handleUpdateSettingsValidation('regex', e.target.value)}
                  placeholder="Örn: /^[A-Z]+$/"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Varsayılan Değer (Default Value)</Label>
                <Input
                  value={currentSettingsField.options?.default_value || ''}
                  onChange={(e) => handleUpdateSettingsOptions('default_value', e.target.value)}
                  placeholder="Giriş yapılmadığında geçerli olacak değer..."
                />
              </div>
            </div>

            {/* Translation & Multi-language */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Çeviri & Yerelleştirme</h4>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="opt-local" 
                  checked={!!currentSettingsField.options?.localized} 
                  onCheckedChange={(val) => handleUpdateSettingsOptions('localized', val)}
                />
                <Label htmlFor="opt-local" className="cursor-pointer">Dile Göre Çevrilebilir Alan (Translatable)</Label>
              </div>
            </div>

            {/* Choice Fields Details Configuration */}
            {(currentSettingsField.options?.field_type === 'Select' || 
              currentSettingsField.options?.field_type === 'Multi Select' || 
              currentSettingsField.options?.field_type === 'Radio' || 
              currentSettingsField.options?.field_type === 'Checkbox') && (
              <div className="space-y-3 pt-4 border-t border-border bg-muted/20 p-3 rounded-lg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sliders className="size-3.5" /> Seçenek Listesi
                </h4>
                <div className="space-y-1">
                  <Label>Seçenekler (Virgülle Ayırın)</Label>
                  <Textarea
                    value={
                      Array.isArray(currentSettingsField.options?.choices) 
                        ? currentSettingsField.options.choices.join(', ') 
                        : currentSettingsField.options?.choices || ''
                    }
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      handleUpdateSettingsOptions('choices', arr);
                    }}
                    placeholder="Örn: Seçenek 1, Seçenek 2, Seçenek 3"
                    rows={2}
                  />
                  <span className="text-[10px] text-muted-foreground">Seçenekleri arasına virgül koyarak yazın.</span>
                </div>
              </div>
            )}

            {/* Relation Target Selection */}
            {currentSettingsField.options?.field_type === 'Relation' && (
              <div className="space-y-4 pt-4 border-t border-border bg-primary/5 p-3 rounded-lg space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Link2 className="size-3.5" /> İlişki Detayları
                </h4>
                
                <div className="space-y-1.5">
                  <Label>Bağlantı Türü (Relation Type)</Label>
                  <Select
                    value={currentSettingsField.options?.relation_type || 'one-to-one'}
                    onValueChange={(val) => handleUpdateSettingsOptions('relation_type', val)}
                  >
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="İlişki yapısı seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-to-one">Bire Bir (One-to-One)</SelectItem>
                      <SelectItem value="one-to-many">Bire Çok (One-to-Many)</SelectItem>
                      <SelectItem value="many-to-one">Çoka Bir (Many-to-One)</SelectItem>
                      <SelectItem value="many-to-many">Çoka Çok (Many-to-Many)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Hedef İçerik Şablonu (Target Content Type)</Label>
                  <Select
                    value={currentSettingsField.options?.target_content_type || ''}
                    onValueChange={(val) => {
                      handleUpdateSettingsOptions('target_content_type', val);
                      handleUpdateSettingsField('type', 'string'); 
                    }}
                  >
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Bağlanacak şablonu seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypesList?.filter(t => t.id !== contentType?.id).map((type) => (
                        <SelectItem key={type.id} value={type.slug}>
                          {type.name} (/{type.slug})
                        </SelectItem>
                      ))}
                      {(!contentTypesList || contentTypesList.length === 0) && (
                        <SelectItem value="_empty" disabled>Kullanılabilir şablon bulunmamaktadır.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Conditional Logic Configuration */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Koşullu Görünürlük (Conditional Logic)</h4>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="cond-enabled" 
                  checked={!!currentSettingsField.options?.conditional_logic_enabled} 
                  onCheckedChange={(val) => handleUpdateSettingsOptions('conditional_logic_enabled', val)}
                />
                <Label htmlFor="cond-enabled" className="cursor-pointer">Koşullu görünürlüğü aktif et</Label>
              </div>

              {!!currentSettingsField.options?.conditional_logic_enabled && (
                <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-3">
                  <span className="text-xs font-semibold block">Bu alanı göster, eğer:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Hedef Alan</Label>
                      <Select
                        value={currentSettingsField.options?.conditional_field || ''}
                        onValueChange={(val) => handleUpdateSettingsOptions('conditional_field', val)}
                      >
                        <SelectTrigger className="bg-card h-8 text-xs">
                          <SelectValue placeholder="Alan Seç..." />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.filter((_, idx) => idx !== fieldSettingsIndex).map((f) => (
                            <SelectItem key={f.slug} value={f.slug} className="text-xs">
                              {f.name} ({f.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px]">Değer Eşitse</Label>
                      <Input
                        value={currentSettingsField.options?.conditional_value || ''}
                        onChange={(e) => handleUpdateSettingsOptions('conditional_value', e.target.value)}
                        placeholder="Örn: video, true"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </RightDrawer>
      )}
    </>
  );
}
