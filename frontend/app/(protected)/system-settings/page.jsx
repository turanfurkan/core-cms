'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Globe,
  Phone,
  Share2,
  Bolt,
  Mail,
  Save,
  LoaderCircleIcon,
  Image as ImageIcon,
  Trash2,
  X,
  Lock,
  MapPin,
  Database,
  RefreshCw,
  Terminal
} from 'lucide-react';
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TimezoneSelect from './components/timezone-select';

const languages = [
  {
    code: 'en',
    name: 'English',
    shortName: 'EN',
    direction: 'ltr',
    flag: '/media/flags/united-states.svg',
  },
  {
    code: 'ar',
    name: 'Arabic',
    shortName: 'AR',
    direction: 'rtl',
    flag: '/media/flags/saudi-arabia.svg',
  },
  {
    code: 'es',
    name: 'Spanish',
    shortName: 'ES',
    direction: 'ltr',
    flag: '/media/flags/spain.svg',
  },
  {
    code: 'de',
    name: 'German',
    shortName: 'DE',
    direction: 'ltr',
    flag: '/media/flags/germany.svg',
  },
  {
    code: 'ch',
    name: 'Chinese',
    shortName: 'CH',
    direction: 'ltr',
    flag: '/media/flags/china.svg',
  },
];

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const logoFileRef = useRef(null);

  // Form states
  const [nameTr, setNameTr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descTr, setDescTr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [logoExistingPreview, setLogoExistingPreview] = useState('');
  const [logoAttachedPreview, setLogoAttachedPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoAction, setLogoAction] = useState(''); // '', 'save', 'remove'

  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [mailHost, setMailHost] = useState('');
  const [mailPort, setMailPort] = useState('');
  const [mailUsername, setMailUsername] = useState('');
  const [mailPassword, setMailPassword] = useState('');

  // Transferred General Settings states
  const [address, setAddress] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Europe/London');
  const [currency, setCurrency] = useState('USD');
  const [currencyFormat, setCurrencyFormat] = useState('$ {value}');
  const [siteActive, setSiteActive] = useState(true);

  // Tabs management
  const [activeTab, setActiveTab] = useState('general');

  // Database Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncOutput, setSyncOutput] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [skipMedia, setSkipMedia] = useState(false);

  const handleSync = async (type) => {
    setIsSyncing(true);
    setSyncOutput(t('system_settings.db_sync.starting', 'Senkronizasyon başlatılıyor... Lütfen bekleyin...\n'));
    try {
      const res = await apiFetch('/api/admin/database-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          'dry_run': type === 'identity' ? dryRun : false,
          'skip_media': type === 'race_billing' ? skipMedia : true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSyncOutput((prev) => prev + `\n[SUCCESS] ${data.message}\n\n` + data.output);
        toast.success(t('system_settings.db_sync.success', 'Veritabanı senkronizasyonu tamamlandı.'));
      } else {
        setSyncOutput((prev) => prev + `\n[FAILED] ${data.message || 'Error occurred'}\n\n` + (data.output || ''));
        toast.error(data.message || t('system_settings.db_sync.error', 'Senkronizasyon başarısız oldu.'));
      }
    } catch (err) {
      setSyncOutput((prev) => prev + `\n[ERROR] ${err.message}\n`);
      toast.error(t('system_settings.db_sync.error', 'Senkronizasyon sırasında bir hata oluştu.'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch settings
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/settings');
      if (!res.ok) throw new Error(t('system_settings.load_error', 'Sistem ayarları yüklenemedi.'));
      return res.json();
    },
  });

  // Hydrate form states when settings load
  useEffect(() => {
    if (response?.data) {
      const settingsArray = response.data;
      const settingsMap = {};
      settingsArray.forEach((item) => {
        settingsMap[item.key] = item.value;
      });

      setNameTr(settingsMap['site.name']?.tr || '');
      setNameEn(settingsMap['site.name']?.en || '');
      setDescTr(settingsMap['site.description']?.tr || '');
      setDescEn(settingsMap['site.description']?.en || '');
      
      setLogoExistingPreview(settingsMap['site.logo'] || '');
      setLogoAttachedPreview('');
      setLogoFile(null);
      setLogoAction('');

      setContactPhone(settingsMap['site.contact_phone'] || '');
      setContactEmail(settingsMap['site.contact_email'] || '');

      setFacebook(settingsMap['site.social_links']?.facebook || '');
      setTwitter(settingsMap['site.social_links']?.twitter || '');
      setInstagram(settingsMap['site.social_links']?.instagram || '');

      setMaintenanceMode(!!settingsMap['site.maintenance_mode']);

      setMailHost(settingsMap['mail.host'] || '');
      setMailPort(settingsMap['mail.port'] ?? '');
      setMailUsername(settingsMap['mail.username'] || '');
      setMailPassword(settingsMap['mail.password'] || '');

      // Hydrate frontend settings
      let frontSettings = settingsMap['frontend.system_settings'] || {};
      if (typeof frontSettings === 'string') {
        try {
          frontSettings = JSON.parse(frontSettings);
        } catch (e) {
          frontSettings = {};
        }
      }
      setAddress(frontSettings.address || '');
      setWebsiteUrl(frontSettings.websiteURL || '');
      setLanguage(frontSettings.language || 'en');
      setTimezone(frontSettings.timezone || 'Europe/London');
      setCurrency(frontSettings.currency || 'USD');
      setCurrencyFormat(frontSettings.currencyFormat || '$ {value}');
      setSiteActive(frontSettings.active !== false);
    }
  }, [response]);

  // Settings update mutation
  const mutation = useMutation({
    mutationFn: async (formData) => {
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || t('system_settings.save_error', 'Ayarlar güncellenemedi.'));
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{t('system_settings.save_success', 'Sistem ve firma ayarları başarıyla güncellendi.')}</AlertTitle>
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
            <AlertTitle>{err.message || t('common.messages.error', 'Bir hata oluştu')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error(t('system_settings.logo_size_error', 'Logo dosyası 1MB\'den küçük olmalıdır.'));
        return;
      }
      setLogoFile(file);
      setLogoAction('save');
      const reader = new FileReader();
      reader.onload = () => setLogoAttachedPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoAttachedPreview('');
    setLogoExistingPreview('');
    setLogoAction('remove');
  };

  const handleCancelLogo = () => {
    setLogoFile(null);
    setLogoAttachedPreview('');
    setLogoAction('');
    if (response?.data) {
      const logoSetting = response.data.find(item => item.key === 'site.logo');
      setLogoExistingPreview(logoSetting ? logoSetting.value : '');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nameTr.trim() || !nameEn.trim()) {
      toast.error(t('system_settings.name_required_error', 'Site Adı alanlarını (TR ve EN) girmelisiniz.'));
      return;
    }

    if (contactEmail.trim() && !/\S+@\S+\.\S+/.test(contactEmail.trim())) {
      toast.error(t('system_settings.email_invalid_error', 'Geçerli bir iletişim e-posta adresi girin.'));
      return;
    }

    const formData = new FormData();
    formData.append('name_tr', nameTr.trim());
    formData.append('name_en', nameEn.trim());
    formData.append('desc_tr', descTr.trim());
    formData.append('desc_en', descEn.trim());
    formData.append('logoAction', logoAction);
    if (logoAction === 'save' && logoFile) {
      formData.append('logoFile', logoFile);
    }
    formData.append('contact_phone', contactPhone.trim());
    formData.append('contact_email', contactEmail.trim());
    formData.append('social_facebook', facebook.trim());
    formData.append('social_twitter', twitter.trim());
    formData.append('social_instagram', instagram.trim());
    formData.append('maintenance_mode', maintenanceMode ? 'true' : 'false');
    formData.append('mail_host', mailHost.trim());
    formData.append('mail_port', mailPort);
    formData.append('mail_username', mailUsername.trim());
    formData.append('mail_password', mailPassword.trim());

    // Transferred settings
    formData.append('site_active', siteActive ? 'true' : 'false');
    formData.append('site_address', address.trim());
    formData.append('site_website_url', websiteUrl.trim());
    formData.append('site_language', language);
    formData.append('site_timezone', timezone);
    formData.append('site_currency', currency);
    formData.append('site_currency_format', currencyFormat);

    mutation.mutate(formData);
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('system_settings.title', 'Genel Sistem ve Firma Ayarları')}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">{t('sidebar.dashboards', 'Dashboard')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('system_settings.breadcrumb_system', 'Sistem Ayarları')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs">{t('system_settings.loading', 'Sistem ayarları yükleniyor...')}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
              {/* Tab Header Card */}
              <Card className="select-none p-3">
                <TabsList variant="line" className="w-full flex-wrap justify-start border-none bg-transparent gap-2 h-auto p-0">
                  <TabsTrigger
                    value="general"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Globe className="size-4" />
                    {t('system_settings.tabs.general', 'Genel Bilgiler')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="contact"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Phone className="size-4" />
                    {t('system_settings.tabs.contact', 'İletişim Bilgileri')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="regional"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <MapPin className="size-4" />
                    {t('system_settings.tabs.regional', 'Bölgesel Ayarlar')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="social"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Share2 className="size-4" />
                    {t('system_settings.tabs.social', 'Sosyal Medya')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="system"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Bolt className="size-4" />
                    {t('system_settings.tabs.system', 'Bakım Modu')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="mail"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Mail className="size-4" />
                    {t('system_settings.tabs.mail', 'Mail Sunucusu (SMTP)')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="db-sync"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Database className="size-4" />
                    {t('system_settings.tabs.db_sync', 'Veritabanı Senkronizasyonu')}
                  </TabsTrigger>
                </TabsList>
              </Card>

              {/* General Tab */}
              <TabsContent value="general" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">{t('system_settings.general.title', 'Genel Site ve Firma Tanımları')}</CardTitle>
                    <CardDescription className="text-xs">{t('system_settings.general.description', 'Web sitenizin ana başlığını, açıklamasını ve logosunu buradan güncelleyin.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Site name split columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="site-name-tr" className="text-xs font-semibold text-muted-foreground">
                          {t('system_settings.general.site_name_tr', 'Site Adı (TR)')}
                        </Label>
                        <Input
                          id="site-name-tr"
                          value={nameTr}
                          onChange={(e) => setNameTr(e.target.value)}
                          placeholder={t('system_settings.general.site_name_placeholder_tr', 'Örn: CoreCMS')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="site-name-en" className="text-xs font-semibold text-muted-foreground">
                          {t('system_settings.general.site_name_en', 'Site Adı (EN)')}
                        </Label>
                        <Input
                          id="site-name-en"
                          value={nameEn}
                          onChange={(e) => setNameEn(e.target.value)}
                          placeholder={t('system_settings.general.site_name_placeholder_en', 'Örn: CoreCMS Headless')}
                        />
                      </div>
                    </div>

                    {/* Site desc split columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="site-desc-tr" className="text-xs font-semibold text-muted-foreground">
                          {t('system_settings.general.site_desc_tr', 'Site Açıklaması (TR)')}
                        </Label>
                        <Textarea
                          id="site-desc-tr"
                          rows={3}
                          value={descTr}
                          onChange={(e) => setDescTr(e.target.value)}
                          placeholder={t('system_settings.general.site_desc_placeholder_tr', 'Ziyaretçiler için sitenizin genel tanımı')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="site-desc-en" className="text-xs font-semibold text-muted-foreground">
                          {t('system_settings.general.site_desc_en', 'Site Açıklaması (EN)')}
                        </Label>
                        <Textarea
                          id="site-desc-en"
                          rows={3}
                          value={descEn}
                          onChange={(e) => setDescEn(e.target.value)}
                          placeholder={t('system_settings.general.site_desc_placeholder_en', 'Ziyaretçiler için sitenizin genel tanımı (İngilizce)')}
                        />
                      </div>
                    </div>

                    {/* Logo Management */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <Label className="text-xs font-semibold text-muted-foreground">{t('system_settings.general.company_logo', 'Firma Logosu')}</Label>
                      <div className="flex items-center gap-5">
                        <div className="relative size-28 border border-border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center">
                          {logoAttachedPreview || logoExistingPreview ? (
                            <img
                              src={logoAttachedPreview || logoExistingPreview}
                              alt="Logo"
                              className="object-contain size-full"
                            />
                          ) : (
                            <ImageIcon className="size-8 text-muted-foreground/40" />
                          )}
                        </div>

                        <div className="space-y-2 select-none">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 text-xs"
                              onClick={() => logoFileRef.current?.click()}
                            >
                              {t('system_settings.general.select_image', 'Görsel Seç')}
                            </Button>
                            {logoAttachedPreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs"
                                onClick={handleCancelLogo}
                              >
                                {t('system_settings.general.cancel', 'İptal')}
                              </Button>
                            )}
                            {(logoExistingPreview || logoAttachedPreview) && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-9 text-xs gap-1.5"
                                onClick={handleRemoveLogo}
                              >
                                <Trash2 className="size-3.5" />
                                {t('system_settings.general.remove', 'Kaldır')}
                              </Button>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {t('system_settings.general.logo_help', 'Desteklenen formatlar: PNG, JPG, WEBP. Maksimum boyut: 1MB.')}
                          </p>
                          <input
                            ref={logoFileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Website URL and Default Language */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="space-y-1.5">
                        <Label htmlFor="site-website-url" className="text-xs font-semibold text-muted-foreground">
                          {t('system_settings.general.website_url', 'Web Sitesi URL')}
                        </Label>
                        <Input
                          id="site-website-url"
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="site-language" className="text-xs font-semibold text-muted-foreground">
                          {t('system_settings.general.default_language', 'Varsayılan Dil')}
                        </Label>
                        <Select
                          onValueChange={setLanguage}
                          value={language}
                        >
                          <SelectTrigger id="site-language">
                            <SelectValue placeholder={t('system_settings.general.select_language_placeholder', 'Dil seçin')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {languages.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                  <span className="flex w-full items-center justify-between gap-2.5">
                                    <img
                                      src={lang.flag}
                                      alt={`${lang.name} flag`}
                                      className="size-4 rounded-full"
                                    />
                                    <span className="grow">{lang.name}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Shop Active Status */}
                    <div className="flex items-center space-x-4 border border-border rounded-lg p-4 bg-muted/5 select-none">
                      <Switch
                        id="site-active"
                        checked={siteActive}
                        onCheckedChange={setSiteActive}
                      />
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setSiteActive(!siteActive)}>
                        <Label htmlFor="site-active" className="text-xs font-bold text-foreground cursor-pointer">
                          {t('system_settings.general.shop_status', 'Mağaza Durumu (Active Status)')}
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          {t('system_settings.general.shop_status_help', 'Mağazanın/sitenin aktif durumunu açın veya kapatın.')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">{t('system_settings.contact.title', 'İletişim Bilgileri')}</CardTitle>
                    <CardDescription className="text-xs">{t('system_settings.contact.description', 'Sistem geneli bildirimler ve iletişim bilgileri')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5 max-w-md">
                      <Label htmlFor="contact-phone" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.contact.phone', 'Telefon Numarası')}
                      </Label>
                      <Input
                        id="contact-phone"
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+90 555 555 55 55"
                      />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <Label htmlFor="contact-email" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.contact.email', 'E-posta Adresi')}
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="info@siteniz.com"
                      />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <Label htmlFor="contact-address" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.contact.address', 'Adres')}
                      </Label>
                      <Textarea
                        id="contact-address"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t('system_settings.contact.address_placeholder', 'Şirket veya mağaza adresi')}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {t('system_settings.contact.address_help', 'Müşteri faturaları ve iletişim için kullanılacak resmi adres.')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Regional Settings Tab */}
              <TabsContent value="regional" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">{t('system_settings.regional.title', 'Bölgesel Ayarlar')}</CardTitle>
                    <CardDescription className="text-xs">{t('system_settings.regional.description', 'Saat dilimi, para birimi ve para birimi görünüm formatı ayarları.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="regional-timezone" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.regional.timezone', 'Saat Dilimi (Timezone)')}
                      </Label>
                      <TimezoneSelect
                        defaultValue={timezone}
                        onChange={setTimezone}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="regional-currency" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.regional.currency', 'Para Birimi (Currency)')}
                      </Label>
                      <Select
                        onValueChange={setCurrency}
                        value={currency}
                      >
                        <SelectTrigger id="regional-currency">
                          <SelectValue placeholder={t('system_settings.regional.select_currency_placeholder', 'Para birimi seçin')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                            <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                            <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="regional-currency-format" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.regional.currency_format', 'Para Formatı (Currency Format)')}
                      </Label>
                      <Select
                        onValueChange={setCurrencyFormat}
                        value={currencyFormat}
                      >
                        <SelectTrigger id="regional-currency-format">
                          <SelectValue placeholder={t('system_settings.regional.select_format_placeholder', 'Para formatı seçin')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="$ {value}">$ {"{value}"}</SelectItem>
                            <SelectItem value="{value} €">{"{value}"} €</SelectItem>
                            <SelectItem value="£ {value}">£ {"{value}"}</SelectItem>
                            <SelectItem value="¥ {value}">¥ {"{value}"}</SelectItem>
                            <SelectItem value="₹ {value}">₹ {"{value}"}</SelectItem>
                            <SelectItem value="{value} TL">{"{value}"} TL</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Social Tab */}
              <TabsContent value="social" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">{t('system_settings.social.title', 'Sosyal Medya Linkleri')}</CardTitle>
                    <CardDescription className="text-xs">{t('system_settings.social.description', 'Firma sosyal medya profillerini entegre edin.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="social-facebook" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.social.facebook', 'Facebook Sayfası URL')}
                      </Label>
                      <Input
                        id="social-facebook"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="https://facebook.com/kullaniciadi"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="social-twitter" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.social.twitter', 'Twitter / X Sayfası URL')}
                      </Label>
                      <Input
                        id="social-twitter"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="https://twitter.com/kullaniciadi"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="social-instagram" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.social.instagram', 'Instagram Sayfası URL')}
                      </Label>
                      <Input
                        id="social-instagram"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="https://instagram.com/kullaniciadi"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System Tab */}
              <TabsContent value="system" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">{t('system_settings.system.title', 'Sistem ve Bakım Modu')}</CardTitle>
                    <CardDescription className="text-xs">{t('system_settings.system.description', 'Web sitesini geçici olarak ziyaretçilere kapatma ayarı.')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 border border-border rounded-lg p-5 bg-muted/5 max-w-2xl select-none">
                      <Switch
                        id="maintenance-mode"
                        checked={maintenanceMode}
                        onCheckedChange={setMaintenanceMode}
                      />
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setMaintenanceMode(!maintenanceMode)}>
                        <Label htmlFor="maintenance-mode" className="text-xs font-bold text-foreground cursor-pointer">
                          {t('system_settings.system.maintenance_mode', 'Sistem Bakım Modu (Maintenance Mode)')}
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          {t('system_settings.system.maintenance_help', 'Bakım modunu aktif ederseniz, web sitenizin ön yüzü ziyaretçilere geçici olarak kapatılacak ve bilgi ekranı gösterilecektir. Yöneticiler panele erişmeye devam edebilir.')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mail SMTP Tab */}
              <TabsContent value="mail" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-1.5">
                      <Lock className="size-4.5 text-muted-foreground" />
                      {t('system_settings.mail.title', 'E-posta Sunucu Bağlantısı (SMTP)')}
                    </CardTitle>
                    <CardDescription className="text-xs">{t('system_settings.mail.description', 'Sistemin otomatik bilgi ve şifre sıfırlama e-postaları göndermesi için sunucu bilgilerini girin.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="mail-host" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.mail.host', 'SMTP Sunucu Adresi (Host)')}
                      </Label>
                      <Input
                        id="mail-host"
                        value={mailHost}
                        onChange={(e) => setMailHost(e.target.value)}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="mail-port" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.mail.port', 'SMTP Port')}
                      </Label>
                      <Input
                        id="mail-port"
                        type="number"
                        value={mailPort}
                        onChange={(e) => setMailPort(e.target.value)}
                        placeholder={t('system_settings.mail.port_placeholder', '587, 465 vb.')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="mail-user" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.mail.username', 'SMTP Kullanıcı Adı (Username)')}
                      </Label>
                      <Input
                        id="mail-user"
                        value={mailUsername}
                        onChange={(e) => setMailUsername(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="mail-pass" className="text-xs font-semibold text-muted-foreground">
                        {t('system_settings.mail.password', 'SMTP Şifresi (Password)')}
                      </Label>
                      <Input
                        id="mail-pass"
                        type="password"
                        value={mailPassword}
                        onChange={(e) => setMailPassword(e.target.value)}
                        placeholder="••••••••••••"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Database Sync Tab */}
              <TabsContent value="db-sync" className="m-0 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Sync Controls */}
                  <div className="space-y-6">
                    {/* Identity Data Sync Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Database className="size-4.5 text-primary" />
                          {t('system_settings.db_sync.identity_title', 'Kullanıcı ve Rol Senkronizasyonu')}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {t('system_settings.db_sync.identity_description', 'Canlıdaki veritabanından kullanıcıları ve rollerini çeker. Seed kullanıcılarını (ID 1-4) korur.')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2 border border-border rounded-lg p-3 bg-muted/5 select-none">
                          <Switch
                            id="db-sync-dry-run"
                            checked={dryRun}
                            onCheckedChange={setDryRun}
                            disabled={isSyncing}
                          />
                          <div className="space-y-0.5 cursor-pointer" onClick={() => !isSyncing && setDryRun(!dryRun)}>
                            <Label htmlFor="db-sync-dry-run" className="text-xs font-bold text-foreground cursor-pointer">
                              {t('system_settings.db_sync.dry_run', 'Simülasyon Modu (Dry Run)')}
                            </Label>
                            <p className="text-[10px] text-muted-foreground">
                              {t('system_settings.db_sync.dry_run_help', 'Aktif edilirse hiçbir veritabanı değişikliği kaydedilmez, sadece işlem simüle edilir.')}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={() => handleSync('identity')}
                          disabled={isSyncing}
                          className="w-full gap-2 font-semibold"
                        >
                          {isSyncing ? (
                            <LoaderCircleIcon className="size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                          {t('system_settings.db_sync.run_identity', 'Kullanıcıları Senkronize Et')}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Race and Billing Data Sync Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Database className="size-4.5 text-rose-500" />
                          {t('system_settings.db_sync.race_billing_title', 'Yarış ve Ödeme Verileri Senkronizasyonu')}
                        </CardTitle>
                        <CardDescription className="text-xs text-rose-500/80">
                          {t('system_settings.db_sync.race_billing_warning', 'DİKKAT: Bu işlem mevcut yerel kategori, yarış, katılımcı ve ödeme tablolarını temizleyip sıfırdan çeker.')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2 border border-border rounded-lg p-3 bg-muted/5 select-none">
                          <Switch
                            id="db-sync-skip-media"
                            checked={skipMedia}
                            onCheckedChange={setSkipMedia}
                            disabled={isSyncing}
                          />
                          <div className="space-y-0.5 cursor-pointer" onClick={() => !isSyncing && setSkipMedia(!skipMedia)}>
                            <Label htmlFor="db-sync-skip-media" className="text-xs font-bold text-foreground cursor-pointer">
                              {t('system_settings.db_sync.skip_media', 'Medya İndirmeyi Atla (Skip Media)')}
                            </Label>
                            <p className="text-[10px] text-muted-foreground">
                              {t('system_settings.db_sync.skip_media_help', 'Önerilen. Görsel ve GPX/Strava dosyalarını indirmeyi atlayarak senkronizasyonu hızlandırır.')}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleSync('race_billing')}
                          disabled={isSyncing}
                          className="w-full gap-2 font-semibold"
                        >
                          {isSyncing ? (
                            <LoaderCircleIcon className="size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                          {t('system_settings.db_sync.run_race_billing', 'Yarış & Ödeme Verilerini Senkronize Et')}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Console Log Output */}
                  <Card className="flex flex-col h-full min-h-[450px]">
                    <CardHeader className="pb-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Terminal className="size-4.5 text-emerald-500" />
                          {t('system_settings.db_sync.console_title', 'Senkronizasyon Konsolu')}
                        </CardTitle>
                        {syncOutput && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSyncOutput('')}
                            className="text-[10px] h-7 px-2"
                          >
                            Temizle
                          </Button>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {t('system_settings.db_sync.console_description', 'Gerçekleştirilen işlemlerin detaylı günlük çıktısı.')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 relative bg-zinc-950 text-zinc-300 font-mono text-xs rounded-b-lg overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 select-text scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent max-h-[480px]">
                        {syncOutput ? (
                          <pre className="whitespace-pre-wrap font-mono break-all leading-relaxed text-left">{syncOutput}</pre>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-zinc-500 select-none py-20">
                            <Terminal className="size-8 mb-2 stroke-[1.5]" />
                            <p>{t('system_settings.db_sync.console_empty', 'Konsol çıktısı bulunmamaktadır.')}</p>
                            <p className="text-[10px] text-zinc-600 mt-1">{t('system_settings.db_sync.console_empty_help', 'Senkronizasyonu başlatmak için sol taraftaki işlemleri kullanın.')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Action Save Button */}
              {activeTab !== 'db-sync' && (
                <div className="pt-2 border-t border-border flex justify-end gap-3 select-none">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="gap-1.5 font-semibold"
                  >
                    {mutation.isPending ? (
                      <LoaderCircleIcon className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {t('system_settings.save_settings', 'Ayarları Kaydet')}
                  </Button>
                </div>
              )}
            </Tabs>
          </form>
        )}
      </Container>
    </>
  );
}
