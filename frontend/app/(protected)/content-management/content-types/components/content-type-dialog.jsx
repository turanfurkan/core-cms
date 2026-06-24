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
  ShieldCheck,
  Eye
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { cn } from '@/lib/utils';

const ICONS_LIST = [
  'Database', 'FileText', 'Globe', 'Sliders', 'Eye', 'Link2', 'Settings2', 'Sparkles'
];

const getIconComponent = (name, className = "size-4") => {
  const icons = {
    Database,
    FileText,
    Globe,
    Sliders,
    Eye,
    Link2,
    Settings2,
    Sparkles
  };
  const IconComponent = icons[name] || Database;
  return <IconComponent className={className} />;
};

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

  // Monetization States
  const [monetizationEnabled, setMonetizationEnabled] = useState(false);
  const [defaultAccessType, setDefaultAccessType] = useState('free');
  const [defaultPrice, setDefaultPrice] = useState(0);
  const [defaultCurrency, setDefaultCurrency] = useState('TRY');

  // Dynamic Zone States
  const [dynamicZoneEnabled, setDynamicZoneEnabled] = useState(false);
  const [dynamicZoneBlocks, setDynamicZoneBlocks] = useState(['hero_banner', 'rich_text', 'collection_display', 'entry_callout', 'statistics_block', 'faq_accordion', 'features_grid', 'integrations_logos', 'testimonial_card', 'timeline_milestones', 'event_banner', 'team_grid', 'campaign_banner']);

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
        // Load regular fields (exclude dynamic_zone)
        const allFields = contentType.fields || [];
        const regularFields = allFields.filter(f => f.type !== 'dynamic_zone');
        setFields(regularFields);
        
        // Settings mapping
        const settings = contentType.settings || {};
        setIcon(settings.icon || 'Database');
        setColor(settings.color || '#3b82f6');
        setSeoEnabled(!!settings.seo_enabled);
        setPreviewUrlPattern(settings.preview_url_pattern || '');

        // Dynamic zone loading from dynamic_zone field in the schema
        const dzField = allFields.find(f => f.type === 'dynamic_zone');
        if (dzField) {
          setDynamicZoneEnabled(true);
          const allowed = dzField.options?.allowed_blocks || [];
          setDynamicZoneBlocks(allowed.map(b => b.type));
        } else {
          setDynamicZoneEnabled(false);
          setDynamicZoneBlocks(['hero_banner', 'rich_text', 'collection_display', 'entry_callout', 'statistics_block', 'faq_accordion', 'features_grid', 'integrations_logos', 'testimonial_card', 'timeline_milestones', 'event_banner', 'team_grid', 'campaign_banner']);
        }

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

        // Monetization mapping
        const monetization = settings.monetization || {};
        setMonetizationEnabled(!!monetization.enabled);
        setDefaultAccessType(monetization.default_access_type || 'free');
        setDefaultPrice(monetization.default_price || 0);
        setDefaultCurrency(monetization.default_currency || 'TRY');
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
        setMonetizationEnabled(false);
        setDefaultAccessType('free');
        setDefaultPrice(0);
        setDefaultCurrency('TRY');
        setDynamicZoneEnabled(false);
        setDynamicZoneBlocks(['hero_banner', 'rich_text', 'collection_display', 'entry_callout', 'statistics_block', 'faq_accordion', 'features_grid', 'integrations_logos', 'testimonial_card', 'timeline_milestones', 'event_banner', 'team_grid', 'campaign_banner']);

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

  const handleFieldsReorder = (newFields) => {
    const titleField = fields.find(f => f.slug === 'title') || fields[0];
    const slugField = fields.find(f => f.slug === 'slug') || fields[1];
    const customFields = newFields.filter(f => f.slug !== 'title' && f.slug !== 'slug');
    setFields([titleField, slugField, ...customFields]);
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

    if (dynamicZoneEnabled) {
      const allowedBlockDefinitions = [
        {
          type: 'hero_banner',
          name: 'Hero Banner (Giriş Görseli)',
          desc: 'Geniş başlık, açıklama ve görsel alanı.',
          fields: [
            { name: 'Başlık (Heading)', slug: 'heading', type: 'string', validation_rules: { required: true }, options: { localized: true } },
            { name: 'Alt Başlık (Subtitle)', slug: 'subtitle', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Arka Plan Görseli', slug: 'background_image', type: 'media', validation_rules: { required: false } }
          ]
        },
        {
          type: 'rich_text',
          name: 'Zengin Metin Alanı (Rich Text)',
          desc: 'WYSIWYG formatında serbest yazı alanı.',
          fields: [
            { name: 'Bölüm Başlığı', slug: 'title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'İçerik (Content)', slug: 'content', type: 'text', validation_rules: { required: true }, options: { localized: true } }
          ]
        },
        {
          type: 'collection_display',
          name: 'Koleksiyon Listeleme (Collection Display)',
          desc: 'Diğer içerik tiplerini (koleksiyonları) carousel veya grid olarak gösterir.',
          fields: [
            { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Hedef Koleksiyon', slug: 'target_content_type_id', type: 'relation_content_type' },
            { name: 'Limit', slug: 'limit', type: 'number', validation_rules: { required: true } },
            { name: 'Görünüm Şablonu', slug: 'layout_style', type: 'select', options: { choices: ['grid', 'carousel', 'list'] } }
          ]
        },
        {
          type: 'entry_callout',
          name: 'Görsel Callout Paneli (Callout Banner)',
          desc: 'Açıklama, yönlendirme butonu ve şık arka plan görseli içeren callout alanı.',
          fields: [
            { name: 'Başlık (Title)', slug: 'title', type: 'string', validation_rules: { required: true }, options: { localized: true } },
            { name: 'Açıklama (Description)', slug: 'description', type: 'text', validation_rules: { required: true }, options: { localized: true } },
            { name: 'Buton Metni', slug: 'cta_text', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Buton Linki', slug: 'cta_url', type: 'string', validation_rules: { required: false } },
            { name: 'Arka Plan Görseli', slug: 'background_image', type: 'media', validation_rules: { required: false } }
          ]
        },
        {
          type: 'statistics_block',
          name: 'İstatistik Sayacı (Statistics Grid)',
          desc: 'Sayılar ve açıklamalardan oluşan yan yana istatistik alanları.',
          fields: [
            { name: 'Bölüm Başlığı', slug: 'title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. İstatistik Sayı', slug: 'stat_1_number', type: 'string', validation_rules: { required: true } },
            { name: '1. İstatistik Etiket', slug: 'stat_1_label', type: 'string', validation_rules: { required: true }, options: { localized: true } },
            { name: '2. İstatistik Sayı', slug: 'stat_2_number', type: 'string', validation_rules: { required: true } },
            { name: '2. İstatistik Etiket', slug: 'stat_2_label', type: 'string', validation_rules: { required: true }, options: { localized: true } },
            { name: '3. İstatistik Sayı', slug: 'stat_3_number', type: 'string', validation_rules: { required: true } },
            { name: '3. İstatistik Etiket', slug: 'stat_3_label', type: 'string', validation_rules: { required: true }, options: { localized: true } }
          ]
        },
        {
          type: 'faq_accordion',
          name: 'Sıkça Sorulan Sorular (FAQ Accordion)',
          desc: 'Açılıp kapanabilir akordiyon formatında SSS başlıkları.',
          fields: [
            { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Soru', slug: 'faq_1_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Cevap', slug: 'faq_1_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Soru', slug: 'faq_2_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Cevap', slug: 'faq_2_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Soru', slug: 'faq_3_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Cevap', slug: 'faq_3_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '4. Soru', slug: 'faq_4_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '4. Cevap', slug: 'faq_4_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '5. Soru', slug: 'faq_5_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '5. Cevap', slug: 'faq_5_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } }
          ]
        },
        {
          type: 'features_grid',
          name: 'Özellik Izgarası (Features Grid)',
          desc: 'Simge, başlık ve açıklamalı 4lü özellik kartları listesi.',
          fields: [
            { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Özellik Başlığı', slug: 'feature_1_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Özellik Açıklaması', slug: 'feature_1_desc', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Özellik Simgesi', slug: 'feature_1_icon', type: 'select', options: { choices: ['Star', 'Heart', 'Check', 'Settings', 'Sparkles', 'Shield', 'Zap', 'Globe'] } },
            { name: '2. Özellik Başlığı', slug: 'feature_2_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Özellik Açıklaması', slug: 'feature_2_desc', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Özellik Simgesi', slug: 'feature_2_icon', type: 'select', options: { choices: ['Star', 'Heart', 'Check', 'Settings', 'Sparkles', 'Shield', 'Zap', 'Globe'] } },
            { name: '3. Özellik Başlığı', slug: 'feature_3_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Özellik Açıklaması', slug: 'feature_3_desc', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Özellik Simgesi', slug: 'feature_3_icon', type: 'select', options: { choices: ['Star', 'Heart', 'Check', 'Settings', 'Sparkles', 'Shield', 'Zap', 'Globe'] } },
            { name: '4. Özellik Başlığı', slug: 'feature_4_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '4. Özellik Açıklaması', slug: 'feature_4_desc', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '4. Özellik Simgesi', slug: 'feature_4_icon', type: 'select', options: { choices: ['Star', 'Heart', 'Check', 'Settings', 'Sparkles', 'Shield', 'Zap', 'Globe'] } }
          ]
        },
        {
          type: 'integrations_logos',
          name: 'Entegrasyon Logoları (Integrations Logos Grid)',
          desc: 'Logo görseli, başlık, açıklama ve Switch butonlu 4lü entegrasyon listesi.',
          fields: [
            { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Logo Görseli', slug: 'integration_1_logo', type: 'media', validation_rules: { required: false } },
            { name: '1. Marka Adı', slug: 'integration_1_name', type: 'string', validation_rules: { required: false } },
            { name: '1. Açıklama', slug: 'integration_1_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Logo Görseli', slug: 'integration_2_logo', type: 'media', validation_rules: { required: false } },
            { name: '2. Marka Adı', slug: 'integration_2_name', type: 'string', validation_rules: { required: false } },
            { name: '2. Açıklama', slug: 'integration_2_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Logo Görseli', slug: 'integration_3_logo', type: 'media', validation_rules: { required: false } },
            { name: '3. Marka Adı', slug: 'integration_3_name', type: 'string', validation_rules: { required: false } },
            { name: '3. Açıklama', slug: 'integration_3_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '4. Logo Görseli', slug: 'integration_4_logo', type: 'media', validation_rules: { required: false } },
            { name: '4. Marka Adı', slug: 'integration_4_name', type: 'string', validation_rules: { required: false } },
            { name: '4. Açıklama', slug: 'integration_4_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } }
          ]
        },
        {
          type: 'testimonial_card',
          name: 'Müşteri Değerlendirmeleri (Testimonials Grid)',
          desc: 'Avatar, ünvan, yorum ve yıldız derecelendirmeli 3lü referans kartları.',
          fields: [
            { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Müşteri Adı', slug: 'testimonial_1_name', type: 'string', validation_rules: { required: false } },
            { name: '1. Ünvan / Rol', slug: 'testimonial_1_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Yorum', slug: 'testimonial_1_quote', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Profil Resmi', slug: 'testimonial_1_avatar', type: 'media', validation_rules: { required: false } },
            { name: '1. Derecelendirme (1-5 Yıldız)', slug: 'testimonial_1_rating', type: 'select', options: { choices: ['5', '4', '3', '2', '1'] } },
            { name: '2. Müşteri Adı', slug: 'testimonial_2_name', type: 'string', validation_rules: { required: false } },
            { name: '2. Ünvan / Rol', slug: 'testimonial_2_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Yorum', slug: 'testimonial_2_quote', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Profil Resmi', slug: 'testimonial_2_avatar', type: 'media', validation_rules: { required: false } },
            { name: '2. Derecelendirme (1-5 Yıldız)', slug: 'testimonial_2_rating', type: 'select', options: { choices: ['5', '4', '3', '2', '1'] } },
            { name: '3. Müşteri Adı', slug: 'testimonial_3_name', type: 'string', validation_rules: { required: false } },
            { name: '3. Ünvan / Rol', slug: 'testimonial_3_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Yorum', slug: 'testimonial_3_quote', type: 'text', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Profil Resmi', slug: 'testimonial_3_avatar', type: 'media', validation_rules: { required: false } },
            { name: '3. Derecelendirme (1-5 Yıldız)', slug: 'testimonial_3_rating', type: 'select', options: { choices: ['5', '4', '3', '2', '1'] } }
          ]
        },
        {
          type: 'timeline_milestones',
          name: 'Zaman Çizelgesi (Timeline Milestones)',
          desc: 'Tarih, başlık, açıklama ve simge içeren kurumsal kilometre taşları.',
          fields: [
            { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Dönem/Yıl', slug: 'milestone_1_year', type: 'string', validation_rules: { required: false } },
            { name: '1. Başlık', slug: 'milestone_1_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Açıklama', slug: 'milestone_1_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Simge', slug: 'milestone_1_icon', type: 'select', options: { choices: ['Calendar', 'Star', 'Flag', 'Award', 'Globe', 'Rocket'] } },
            { name: '2. Dönem/Yıl', slug: 'milestone_2_year', type: 'string', validation_rules: { required: false } },
            { name: '2. Başlık', slug: 'milestone_2_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Açıklama', slug: 'milestone_2_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Simge', slug: 'milestone_2_icon', type: 'select', options: { choices: ['Calendar', 'Star', 'Flag', 'Award', 'Globe', 'Rocket'] } },
            { name: '3. Dönem/Yıl', slug: 'milestone_3_year', type: 'string', validation_rules: { required: false } },
            { name: '3. Başlık', slug: 'milestone_3_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Açıklama', slug: 'milestone_3_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Simge', slug: 'milestone_3_icon', type: 'select', options: { choices: ['Calendar', 'Star', 'Flag', 'Award', 'Globe', 'Rocket'] } },
            { name: '4. Dönem/Yıl', slug: 'milestone_4_year', type: 'string', validation_rules: { required: false } },
            { name: '4. Başlık', slug: 'milestone_4_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '4. Açıklama', slug: 'milestone_4_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '4. Simge', slug: 'milestone_4_icon', type: 'select', options: { choices: ['Calendar', 'Star', 'Flag', 'Award', 'Globe', 'Rocket'] } }
          ]
        },
        {
          type: 'event_banner',
          name: 'Etkinlik & Webinar Duyurusu (Event Banner)',
          desc: 'Kontenjan ilerleme çubuklu ve kayıt butonlu yatay etkinlik paneli.',
          fields: [
            { name: 'Etkinlik Adı', slug: 'event_title', type: 'string', validation_rules: { required: true }, options: { localized: true } },
            { name: 'Açıklama', slug: 'event_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Etkinlik Kodu', slug: 'event_code', type: 'string', validation_rules: { required: false } },
            { name: 'Dolu Koltuk Sayısı', slug: 'filled_seats', type: 'number', validation_rules: { required: false } },
            { name: 'Toplam Koltuk Sayısı', slug: 'total_seats', type: 'number', validation_rules: { required: false } },
            { name: 'Buton Metni', slug: 'cta_text', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Buton Linki', slug: 'cta_url', type: 'string', validation_rules: { required: false } }
          ]
        },
        {
          type: 'team_grid',
          name: 'Ekip Üyeleri Izgarası (Team Grid)',
          desc: 'Ünvan, profil resmi ve sosyal ağ linkli 4lü ekip listesi.',
          fields: [
            { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Üye Adı', slug: 'member_1_name', type: 'string', validation_rules: { required: false } },
            { name: '1. Rol / Ünvan', slug: 'member_1_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '1. Profil Resmi', slug: 'member_1_avatar', type: 'media', validation_rules: { required: false } },
            { name: '1. Twitter Linki', slug: 'member_1_social_twitter', type: 'string', validation_rules: { required: false } },
            { name: '1. LinkedIn Linki', slug: 'member_1_social_linkedin', type: 'string', validation_rules: { required: false } },
            { name: '2. Üye Adı', slug: 'member_2_name', type: 'string', validation_rules: { required: false } },
            { name: '2. Rol / Ünvan', slug: 'member_2_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '2. Profil Resmi', slug: 'member_2_avatar', type: 'media', validation_rules: { required: false } },
            { name: '2. Twitter Linki', slug: 'member_2_social_twitter', type: 'string', validation_rules: { required: false } },
            { name: '2. LinkedIn Linki', slug: 'member_2_social_linkedin', type: 'string', validation_rules: { required: false } },
            { name: '3. Üye Adı', slug: 'member_3_name', type: 'string', validation_rules: { required: false } },
            { name: '3. Rol / Ünvan', slug: 'member_3_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '3. Profil Resmi', slug: 'member_3_avatar', type: 'media', validation_rules: { required: false } },
            { name: '3. Twitter Linki', slug: 'member_3_social_twitter', type: 'string', validation_rules: { required: false } },
            { name: '3. LinkedIn Linki', slug: 'member_3_social_linkedin', type: 'string', validation_rules: { required: false } },
            { name: '4. Üye Adı', slug: 'member_4_name', type: 'string', validation_rules: { required: false } },
            { name: '4. Rol / Ünvan', slug: 'member_4_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: '4. Profil Resmi', slug: 'member_4_avatar', type: 'media', validation_rules: { required: false } },
            { name: '4. Twitter Linki', slug: 'member_4_social_twitter', type: 'string', validation_rules: { required: false } },
            { name: '4. LinkedIn Linki', slug: 'member_4_social_linkedin', type: 'string', validation_rules: { required: false } }
          ]
        },
        {
          type: 'campaign_banner',
          name: 'Kampanya & Promosyon Kartı (Campaign Banner)',
          desc: 'İndirim oranı, kupon kodu kopyalama alanı ve ilerleme durumlu duyuru paneli.',
          fields: [
            { name: 'Kampanya Başlığı', slug: 'title', type: 'string', validation_rules: { required: true }, options: { localized: true } },
            { name: 'Kampanya Açıklaması', slug: 'description', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Kupon / Promosyon Kodu', slug: 'promo_code', type: 'string', validation_rules: { required: false } },
            { name: 'İndirim Etiketi', slug: 'discount_label', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'İlerleme Yüzdesi (0-100)', slug: 'progress_percent', type: 'number', validation_rules: { required: false } },
            { name: 'Buton Metni', slug: 'cta_text', type: 'string', validation_rules: { required: false }, options: { localized: true } },
            { name: 'Buton Linki', slug: 'cta_url', type: 'string', validation_rules: { required: false } }
          ]
        }
      ];

      const selectedAllowedBlocks = allowedBlockDefinitions.filter(b => dynamicZoneBlocks.includes(b.type));

      finalFields.push({
        name: 'Dinamik Bloklar',
        slug: 'dynamic_blocks',
        type: 'dynamic_zone',
        validation_rules: { required: false },
        options: {
          allowed_blocks: selectedAllowedBlocks,
          localized: false
        },
        order: finalFields.length + 1
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
        },
        monetization: {
          enabled: monetizationEnabled,
          default_access_type: defaultAccessType,
          default_price: defaultPrice,
          default_currency: defaultCurrency
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
      if (isCollection) {
        setStep(2);
      } else {
        setStep(3);
      }
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
    if (step > 1) {
      if (step === 3 && !isCollection) {
        setStep(1);
      } else {
        setStep(step - 1);
      }
    }
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

            {isCollection ? (
              <>
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
              </>
            ) : (
              <>
                <span className="h-px w-8 bg-border mx-1" />

                <span className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3 ? 'bg-primary text-white scale-110 shadow-sm' : 'bg-muted text-muted-foreground'
                }`}>
                  2
                </span>
                <span className={`text-xs font-bold ${step === 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Gelişmiş Ayarlar
                </span>
              </>
            )}
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
              <RadioGroup 
                value={isCollection ? 'collection' : 'single'} 
                onValueChange={(val) => setIsCollection(val === 'collection')}
                className="grid grid-cols-2 gap-4"
              >
                <label 
                  htmlFor="structure-collection"
                  className={`border border-border p-4 rounded-xl cursor-pointer hover:bg-muted/10 flex items-start gap-3 transition-all ${
                    isCollection ? 'border-primary bg-primary/5' : 'bg-card'
                  }`}
                >
                  <RadioGroupItem
                    value="collection"
                    id="structure-collection"
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-sm text-foreground block">Collection Type</span>
                    <span className="text-[10px] text-muted-foreground leading-relaxed block mt-0.5">
                      Birden fazla içerik girişi oluşturulabilir (Örn: Bloglar, Ürünler, Haberler).
                    </span>
                  </div>
                </label>

                <label 
                  htmlFor="structure-single"
                  className={`border border-border p-4 rounded-xl cursor-pointer hover:bg-muted/10 flex items-start gap-3 transition-all ${
                    !isCollection ? 'border-primary bg-primary/5' : 'bg-card'
                  }`}
                >
                  <RadioGroupItem
                    value="single"
                    id="structure-single"
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-sm text-foreground block">Single Type</span>
                    <span className="text-[10px] text-muted-foreground leading-relaxed block mt-0.5">
                      Tek bir içerik girişi oluşturulabilir (Örn: Hakkımızda, İletişim, Ana Sayfa).
                    </span>
                  </div>
                </label>
              </RadioGroup>
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
                            {getIconComponent(ic, "size-4")}
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
            <Sortable
              value={fields}
              onValueChange={handleFieldsReorder}
              getItemValue={(field) => field.slug}
              className="space-y-3"
            >
              {fields.map((field, idx) => {
                const isLocked = isLockedField(field);
                const fieldLabel = field.options?.field_type || field.type;

                return (
                  <SortableItem key={field.slug} value={field.slug} disabled={isLocked}>
                    <div 
                      className={`bg-card border p-4 rounded-xl flex items-center justify-between hover:shadow-sm transition-all group ${
                        isLocked ? 'border-border bg-muted/10' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SortableItemHandle 
                          disabled={isLocked}
                          className={cn("text-muted-foreground", isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-grab hover:text-foreground')}
                        >
                          <Grid className="size-4.5" />
                        </SortableItemHandle>
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
                  </SortableItem>
                );
              })}
            </Sortable>
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

            {/* Dinamik Blok Yapısı (Dynamic Zone) */}
            <div className="space-y-4 p-5 border border-border rounded-xl bg-card">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sliders className="size-4 text-primary" />
                    Dinamik Blok Yapısı (Dynamic Zones)
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Editörlerin sayfa içeriğinde sürükle-bırak bloklar (Hero, Metin, Koleksiyonlar) oluşturmasına izin verin.
                  </span>
                </div>
                <Switch 
                  id="dynamic-zone-enable"
                  checked={dynamicZoneEnabled}
                  onCheckedChange={setDynamicZoneEnabled}
                />
              </div>

              {dynamicZoneEnabled && (
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Kullanılabilecek Blok Tipleri</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { type: 'hero_banner', name: '🖼️ Giriş Görseli (Hero)', desc: 'Geniş başlık, alt başlık ve buton alanı.' },
                      { type: 'rich_text', name: '✍️ Zengin Metin', desc: 'WYSIWYG formatında serbest yazı alanı.' },
                      { type: 'collection_display', name: '🗂️ Koleksiyon Listeleme', desc: 'İçerikleri carousel veya grid şeklinde listeler.' },
                      { type: 'entry_callout', name: '📢 Görsel Callout', desc: 'Buton ve görsel içeren callout alanı.' },
                      { type: 'statistics_block', name: '📊 İstatistik Sayacı', desc: 'İstatistik sayıları ve etiketleri.' },
                      { type: 'faq_accordion', name: '❓ SSS Akordiyon', desc: 'SSS başlıkları ve cevapları.' },
                      { type: 'features_grid', name: '🚀 Özellik Izgarası', desc: 'Simge, başlık ve açıklamalı kartlar.' },
                      { type: 'integrations_logos', name: '🔌 Entegrasyon Logoları', desc: 'Resim, başlık ve durum butonlu liste.' },
                      { type: 'testimonial_card', name: '💬 Müşteri Değerlendirmeleri', desc: 'Yorumlar ve puanlamalar.' },
                      { type: 'timeline_milestones', name: '📅 Zaman Çizelgesi', desc: 'Kilometre taşları ve dönem tarihleri.' },
                      { type: 'event_banner', name: '🎟️ Etkinlik Duyurusu', desc: 'Katılımcı ve ilerleme durumlu yatay kart.' },
                      { type: 'team_grid', name: '👥 Ekip Üyeleri', desc: 'Roller ve sosyal medya linkli ekip.' },
                      { type: 'campaign_banner', name: '📈 Kampanya Paneli', desc: 'İndirim oranı ve kupon kopyalama alanı.' }
                    ].map((block) => {
                      const isChecked = dynamicZoneBlocks.includes(block.type);
                      return (
                        <div key={block.type} className="flex items-start gap-2.5 p-3 border border-border rounded-xl bg-card hover:bg-muted/10 [&:has([data-state=checked])]:border-primary/50">
                          <Checkbox
                            id={`dz-block-${block.type}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setDynamicZoneBlocks([...dynamicZoneBlocks, block.type]);
                              } else {
                                setDynamicZoneBlocks(dynamicZoneBlocks.filter(b => b !== block.type));
                              }
                            }}
                            className="mt-0.5"
                          />
                          <label htmlFor={`dz-block-${block.type}`} className="cursor-pointer select-none">
                            <span className="text-xs font-bold text-foreground block">{block.name}</span>
                            <span className="text-[9px] text-muted-foreground block mt-0.5 leading-normal">{block.desc}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Para Kazanma Modülü */}
            <div className="space-y-4 p-5 border border-border rounded-xl bg-card">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {t('content_types.monetization.title', 'Satış ve Para Kazanma')}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {t('content_types.monetization.description', 'İçerikleri ödeme duvarı (paywall) arkasına almayı veya tekil satışı aktif eder.')}
                  </span>
                </div>
                <Switch 
                  id="monetization-enable"
                  checked={monetizationEnabled}
                  onCheckedChange={setMonetizationEnabled}
                />
              </div>

              {monetizationEnabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>{t('content_types.monetization.default_access_model', 'Varsayılan Erişim Modeli')}</Label>
                    <Select value={defaultAccessType} onValueChange={setDefaultAccessType}>
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">{t('content_types.monetization.access_everyone', 'Herkes (Ücretsiz)')}</SelectItem>
                        <SelectItem value="protected">{t('content_types.monetization.access_members', 'Sadece Üyeler (Üyelik Planı)')}</SelectItem>
                        <SelectItem value="premium">{t('content_types.monetization.access_single_purchase', 'Tekil Satın Alma (Ödeme Duvarı)')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {defaultAccessType === 'premium' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label>{t('content_types.monetization.default_price', 'Varsayılan Fiyat')}</Label>
                        <Input 
                          type="number" 
                          value={defaultPrice} 
                          onChange={(e) => setDefaultPrice(Number(e.target.value))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('content_types.monetization.currency', 'Para Birimi')}</Label>
                        <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                          <SelectTrigger className="bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TRY">TRY</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

            {/* Dynamic Zone Allowed Blocks Configuration */}
            {(currentSettingsField.type === 'dynamic_zone' || currentSettingsField.options?.field_type === 'Dynamic Zone') && (
              <div className="space-y-4 pt-4 border-t border-border bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-primary" /> İzin Verilen Bloklar (Allowed Blocks)
                </h4>
                <p className="text-[10px] text-muted-foreground">Editörlerin bu bölgeye ekleyebileceği sayfa bileşenlerini seçin.</p>
                
                <div className="space-y-3">
                  {[
                    {
                      type: 'hero_banner',
                      name: 'Hero Banner (Giriş Görseli)',
                      desc: 'Geniş başlık, açıklama ve görsel alanı.',
                      fields: [
                        { name: 'Başlık (Heading)', slug: 'heading', type: 'string', validation_rules: { required: true }, options: { localized: true } },
                        { name: 'Alt Başlık (Subtitle)', slug: 'subtitle', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Arka Plan Görseli', slug: 'background_image', type: 'media', validation_rules: { required: false } }
                      ]
                    },
                    {
                      type: 'rich_text',
                      name: 'Zengin Metin Alanı (Rich Text)',
                      desc: 'WYSIWYG formatında serbest yazı alanı.',
                      fields: [
                        { name: 'Bölüm Başlığı', slug: 'title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'İçerik (Content)', slug: 'content', type: 'text', validation_rules: { required: true }, options: { localized: true } }
                      ]
                    },
                    {
                      type: 'collection_display',
                      name: 'Koleksiyon Listeleme (Collection Display)',
                      desc: 'Diğer içerik tiplerini (koleksiyonları) carousel veya grid olarak gösterir.',
                      fields: [
                        { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Hedef Koleksiyon', slug: 'target_content_type_id', type: 'relation_content_type' },
                        { name: 'Limit', slug: 'limit', type: 'number', validation_rules: { required: true } },
                        { name: 'Görünüm Şablonu', slug: 'layout_style', type: 'select', options: { choices: ['grid', 'carousel', 'list'] } }
                      ]
                    },
                    {
                      type: 'entry_callout',
                      name: 'Görsel Callout Paneli (Callout Banner)',
                      desc: 'Açıklama, yönlendirme butonu ve şık arka plan görseli içeren callout alanı.',
                      fields: [
                        { name: 'Başlık (Title)', slug: 'title', type: 'string', validation_rules: { required: true }, options: { localized: true } },
                        { name: 'Açıklama (Description)', slug: 'description', type: 'text', validation_rules: { required: true }, options: { localized: true } },
                        { name: 'Buton Metni', slug: 'cta_text', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Buton Linki', slug: 'cta_url', type: 'string', validation_rules: { required: false } },
                        { name: 'Arka Plan Görseli', slug: 'background_image', type: 'media', validation_rules: { required: false } }
                      ]
                    },
                    {
                      type: 'statistics_block',
                      name: 'İstatistik Sayacı (Statistics Grid)',
                      desc: 'Sayılar ve açıklamalardan oluşan yan yana istatistik alanları.',
                      fields: [
                        { name: 'Bölüm Başlığı', slug: 'title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. İstatistik Sayı', slug: 'stat_1_number', type: 'string', validation_rules: { required: true } },
                        { name: '1. İstatistik Etiket', slug: 'stat_1_label', type: 'string', validation_rules: { required: true }, options: { localized: true } },
                        { name: '2. İstatistik Sayı', slug: 'stat_2_number', type: 'string', validation_rules: { required: true } },
                        { name: '2. İstatistik Etiket', slug: 'stat_2_label', type: 'string', validation_rules: { required: true }, options: { localized: true } },
                        { name: '3. İstatistik Sayı', slug: 'stat_3_number', type: 'string', validation_rules: { required: true } },
                        { name: '3. İstatistik Etiket', slug: 'stat_3_label', type: 'string', validation_rules: { required: true }, options: { localized: true } }
                      ]
                    },
                    {
                      type: 'faq_accordion',
                      name: 'Sıkça Sorulan Sorular (FAQ Accordion)',
                      desc: 'Açılıp kapanabilir akordiyon formatında SSS başlıkları.',
                      fields: [
                        { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Soru', slug: 'faq_1_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Cevap', slug: 'faq_1_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Soru', slug: 'faq_2_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Cevap', slug: 'faq_2_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Soru', slug: 'faq_3_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Cevap', slug: 'faq_3_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '4. Soru', slug: 'faq_4_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '4. Cevap', slug: 'faq_4_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '5. Soru', slug: 'faq_5_question', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '5. Cevap', slug: 'faq_5_answer', type: 'text', validation_rules: { required: false }, options: { localized: true } }
                      ]
                    },
                    {
                      type: 'features_grid',
                      name: 'Özellik Izgarası (Features Grid)',
                      desc: 'Simge, başlık ve açıklamalı 4lü özellik kartları listesi.',
                      fields: [
                        { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Özellik Başlığı', slug: 'feature_1_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Özellik Açıklaması', slug: 'feature_1_desc', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Özellik Simgesi', slug: 'feature_1_icon', type: 'select', options: { choices: ['Star', 'Heart', 'Check', 'Settings', 'Sparkles', 'Shield', 'Zap', 'Globe'] } },
                        { name: '2. Özellik Başlığı', slug: 'feature_2_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Özellik Açıklaması', slug: 'feature_2_desc', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Özellik Simgesi', slug: 'feature_2_icon', type: 'select', options: { choices: ['Star', 'Heart', 'Check', 'Settings', 'Sparkles', 'Shield', 'Zap', 'Globe'] } },
                        { name: '3. Özellik Başlığı', slug: 'feature_3_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Özellik Açıklaması', slug: 'feature_3_desc', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Özellik Simgesi', slug: 'feature_3_icon', type: 'select', options: { choices: ['Star', 'Heart', 'Check', 'Settings', 'Sparkles', 'Shield', 'Zap', 'Globe'] } },
                        { name: '4. Özellik Başlığı', slug: 'feature_4_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '4. Özellik Açıklaması', slug: 'feature_4_desc', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '4. Özellik Simgesi', slug: 'feature_4_icon', type: 'select', options: { choices: ['Star', 'Heart', 'Check', 'Settings', 'Sparkles', 'Shield', 'Zap', 'Globe'] } }
                      ]
                    },
                    {
                      type: 'integrations_logos',
                      name: 'Entegrasyon Logoları (Integrations Logos Grid)',
                      desc: 'Logo görseli, başlık, açıklama ve Switch butonlu 4lü entegrasyon listesi.',
                      fields: [
                        { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Logo Görseli', slug: 'integration_1_logo', type: 'media', validation_rules: { required: false } },
                        { name: '1. Marka Adı', slug: 'integration_1_name', type: 'string', validation_rules: { required: false } },
                        { name: '1. Açıklama', slug: 'integration_1_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Logo Görseli', slug: 'integration_2_logo', type: 'media', validation_rules: { required: false } },
                        { name: '2. Marka Adı', slug: 'integration_2_name', type: 'string', validation_rules: { required: false } },
                        { name: '2. Açıklama', slug: 'integration_2_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Logo Görseli', slug: 'integration_3_logo', type: 'media', validation_rules: { required: false } },
                        { name: '3. Marka Adı', slug: 'integration_3_name', type: 'string', validation_rules: { required: false } },
                        { name: '3. Açıklama', slug: 'integration_3_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '4. Logo Görseli', slug: 'integration_4_logo', type: 'media', validation_rules: { required: false } },
                        { name: '4. Marka Adı', slug: 'integration_4_name', type: 'string', validation_rules: { required: false } },
                        { name: '4. Açıklama', slug: 'integration_4_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } }
                      ]
                    },
                    {
                      type: 'testimonial_card',
                      name: 'Müşteri Değerlendirmeleri (Testimonials Grid)',
                      desc: 'Avatar, ünvan, yorum ve yıldız derecelendirmeli 3lü referans kartları.',
                      fields: [
                        { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Müşteri Adı', slug: 'testimonial_1_name', type: 'string', validation_rules: { required: false } },
                        { name: '1. Ünvan / Rol', slug: 'testimonial_1_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Yorum', slug: 'testimonial_1_quote', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Profil Resmi', slug: 'testimonial_1_avatar', type: 'media', validation_rules: { required: false } },
                        { name: '1. Derecelendirme (1-5 Yıldız)', slug: 'testimonial_1_rating', type: 'select', options: { choices: ['5', '4', '3', '2', '1'] } },
                        { name: '2. Müşteri Adı', slug: 'testimonial_2_name', type: 'string', validation_rules: { required: false } },
                        { name: '2. Ünvan / Rol', slug: 'testimonial_2_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Yorum', slug: 'testimonial_2_quote', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Profil Resmi', slug: 'testimonial_2_avatar', type: 'media', validation_rules: { required: false } },
                        { name: '2. Derecelendirme (1-5 Yıldız)', slug: 'testimonial_2_rating', type: 'select', options: { choices: ['5', '4', '3', '2', '1'] } },
                        { name: '3. Müşteri Adı', slug: 'testimonial_3_name', type: 'string', validation_rules: { required: false } },
                        { name: '3. Ünvan / Rol', slug: 'testimonial_3_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Yorum', slug: 'testimonial_3_quote', type: 'text', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Profil Resmi', slug: 'testimonial_3_avatar', type: 'media', validation_rules: { required: false } },
                        { name: '3. Derecelendirme (1-5 Yıldız)', slug: 'testimonial_3_rating', type: 'select', options: { choices: ['5', '4', '3', '2', '1'] } }
                      ]
                    },
                    {
                      type: 'timeline_milestones',
                      name: 'Zaman Çizelgesi (Timeline Milestones)',
                      desc: 'Tarih, başlık, açıklama ve simge içeren kurumsal kilometre taşları.',
                      fields: [
                        { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Dönem/Yıl', slug: 'milestone_1_year', type: 'string', validation_rules: { required: false } },
                        { name: '1. Başlık', slug: 'milestone_1_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Açıklama', slug: 'milestone_1_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Simge', slug: 'milestone_1_icon', type: 'select', options: { choices: ['Calendar', 'Star', 'Flag', 'Award', 'Globe', 'Rocket'] } },
                        { name: '2. Dönem/Yıl', slug: 'milestone_2_year', type: 'string', validation_rules: { required: false } },
                        { name: '2. Başlık', slug: 'milestone_2_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Açıklama', slug: 'milestone_2_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Simge', slug: 'milestone_2_icon', type: 'select', options: { choices: ['Calendar', 'Star', 'Flag', 'Award', 'Globe', 'Rocket'] } },
                        { name: '3. Dönem/Yıl', slug: 'milestone_3_year', type: 'string', validation_rules: { required: false } },
                        { name: '3. Başlık', slug: 'milestone_3_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Açıklama', slug: 'milestone_3_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Simge', slug: 'milestone_3_icon', type: 'select', options: { choices: ['Calendar', 'Star', 'Flag', 'Award', 'Globe', 'Rocket'] } },
                        { name: '4. Dönem/Yıl', slug: 'milestone_4_year', type: 'string', validation_rules: { required: false } },
                        { name: '4. Başlık', slug: 'milestone_4_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '4. Açıklama', slug: 'milestone_4_desc', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '4. Simge', slug: 'milestone_4_icon', type: 'select', options: { choices: ['Calendar', 'Star', 'Flag', 'Award', 'Globe', 'Rocket'] } }
                      ]
                    },
                    {
                      type: 'event_banner',
                      name: 'Etkinlik & Webinar Duyurusu (Event Banner)',
                      desc: 'Kontenjan ilerleme çubuklu ve kayıt butonlu yatay etkinlik paneli.',
                      fields: [
                        { name: 'Etkinlik Adı', slug: 'event_title', type: 'string', validation_rules: { required: true }, options: { localized: true } },
                        { name: 'Açıklama', slug: 'event_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Etkinlik Kodu', slug: 'event_code', type: 'string', validation_rules: { required: false } },
                        { name: 'Dolu Koltuk Sayısı', slug: 'filled_seats', type: 'number', validation_rules: { required: false } },
                        { name: 'Toplam Koltuk Sayısı', slug: 'total_seats', type: 'number', validation_rules: { required: false } },
                        { name: 'Buton Metni', slug: 'cta_text', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Buton Linki', slug: 'cta_url', type: 'string', validation_rules: { required: false } }
                      ]
                    },
                    {
                      type: 'team_grid',
                      name: 'Ekip Üyeleri Izgarası (Team Grid)',
                      desc: 'Ünvan, profil resmi ve sosyal ağ linkli 4lü ekip listesi.',
                      fields: [
                        { name: 'Bölüm Başlığı', slug: 'section_title', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Bölüm Alt Başlığı', slug: 'section_subtitle', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Üye Adı', slug: 'member_1_name', type: 'string', validation_rules: { required: false } },
                        { name: '1. Rol / Ünvan', slug: 'member_1_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '1. Profil Resmi', slug: 'member_1_avatar', type: 'media', validation_rules: { required: false } },
                        { name: '1. Twitter Linki', slug: 'member_1_social_twitter', type: 'string', validation_rules: { required: false } },
                        { name: '1. LinkedIn Linki', slug: 'member_1_social_linkedin', type: 'string', validation_rules: { required: false } },
                        { name: '2. Üye Adı', slug: 'member_2_name', type: 'string', validation_rules: { required: false } },
                        { name: '2. Rol / Ünvan', slug: 'member_2_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '2. Profil Resmi', slug: 'member_2_avatar', type: 'media', validation_rules: { required: false } },
                        { name: '2. Twitter Linki', slug: 'member_2_social_twitter', type: 'string', validation_rules: { required: false } },
                        { name: '2. LinkedIn Linki', slug: 'member_2_social_linkedin', type: 'string', validation_rules: { required: false } },
                        { name: '3. Üye Adı', slug: 'member_3_name', type: 'string', validation_rules: { required: false } },
                        { name: '3. Rol / Ünvan', slug: 'member_3_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '3. Profil Resmi', slug: 'member_3_avatar', type: 'media', validation_rules: { required: false } },
                        { name: '3. Twitter Linki', slug: 'member_3_social_twitter', type: 'string', validation_rules: { required: false } },
                        { name: '3. LinkedIn Linki', slug: 'member_3_social_linkedin', type: 'string', validation_rules: { required: false } },
                        { name: '4. Üye Adı', slug: 'member_4_name', type: 'string', validation_rules: { required: false } },
                        { name: '4. Rol / Ünvan', slug: 'member_4_role', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: '4. Profil Resmi', slug: 'member_4_avatar', type: 'media', validation_rules: { required: false } },
                        { name: '4. Twitter Linki', slug: 'member_4_social_twitter', type: 'string', validation_rules: { required: false } },
                        { name: '4. LinkedIn Linki', slug: 'member_4_social_linkedin', type: 'string', validation_rules: { required: false } }
                      ]
                    },
                    {
                      type: 'campaign_banner',
                      name: 'Kampanya & Promosyon Kartı (Campaign Banner)',
                      desc: 'İndirim oranı, kupon kodu kopyalama alanı ve ilerleme durumlu duyuru paneli.',
                      fields: [
                        { name: 'Kampanya Başlığı', slug: 'title', type: 'string', validation_rules: { required: true }, options: { localized: true } },
                        { name: 'Kampanya Açıklaması', slug: 'description', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Kupon / Promosyon Kodu', slug: 'promo_code', type: 'string', validation_rules: { required: false } },
                        { name: 'İndirim Etiketi', slug: 'discount_label', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'İlerleme Yüzdesi (0-100)', slug: 'progress_percent', type: 'number', validation_rules: { required: false } },
                        { name: 'Buton Metni', slug: 'cta_text', type: 'string', validation_rules: { required: false }, options: { localized: true } },
                        { name: 'Buton Linki', slug: 'cta_url', type: 'string', validation_rules: { required: false } }
                      ]
                    }
                  ].map((presetBlock) => {
                    const currentAllowed = currentSettingsField.options?.allowed_blocks || [];
                    const isChecked = currentAllowed.some(b => b.type === presetBlock.type);
                    
                    return (
                      <div key={presetBlock.type} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-xs transition-all">
                        <Checkbox
                          id={`block-${presetBlock.type}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const newAllowed = [...currentAllowed, presetBlock];
                              handleUpdateSettingsOptions('allowed_blocks', newAllowed);
                              handleUpdateSettingsField('type', 'dynamic_zone');
                            } else {
                              const newAllowed = currentAllowed.filter(b => b.type !== presetBlock.type);
                              handleUpdateSettingsOptions('allowed_blocks', newAllowed);
                            }
                          }}
                          className="mt-0.5"
                        />
                        <label htmlFor={`block-${presetBlock.type}`} className="cursor-pointer select-none flex-1">
                          <span className="text-xs font-bold text-slate-800 block">{presetBlock.name}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 leading-relaxed">{presetBlock.desc}</span>
                        </label>
                      </div>
                    );
                  })}
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
