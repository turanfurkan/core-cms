'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout, Megaphone, Menu, PanelBottom, Save, LoaderCircleIcon, Clock, Sparkles } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function InterfaceSettingsPage() {
  const queryClient = useQueryClient();

  // Settings State
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementTextTr, setAnnouncementTextTr] = useState('');
  const [announcementTextEn, setAnnouncementTextEn] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [headerMenu, setHeaderMenu] = useState('');
  const [logoHeight, setLogoHeight] = useState('40');
  const [headerSticky, setHeaderSticky] = useState(true);
  const [footerMenu, setFooterMenu] = useState('');
  const [footerDescTr, setFooterDescTr] = useState('');
  const [footerDescEn, setFooterDescEn] = useState('');
  const [newsletterActive, setNewsletterActive] = useState(true);
  const [footerShowContact, setFooterShowContact] = useState(true);
  const [footerShowSocial, setFooterShowSocial] = useState(true);

  // New Top Bar toggles
  const [topBarContactShow, setTopBarContactShow] = useState(false);
  const [topBarLangShow, setTopBarLangShow] = useState(false);
  const [topBarThemeShow, setTopBarThemeShow] = useState(false);

  // New Countdown states
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownLabelTr, setCountdownLabelTr] = useState('');
  const [countdownLabelEn, setCountdownLabelEn] = useState('');

  // New CTA button states
  const [ctaActive, setCtaActive] = useState(false);
  const [ctaTextTr, setCtaTextTr] = useState('');
  const [ctaTextEn, setCtaTextEn] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [ctaStyle, setCtaStyle] = useState('gradient');

  // Fetch all settings (including frontend.system_settings)
  const { data: settingsResponse, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/settings');
      if (!res.ok) throw new Error('Sistem ayarları yüklenemedi.');
      return res.json();
    },
  });

  // Fetch navigations list for dropdowns
  const { data: navsResponse, isLoading: navsLoading } = useQuery({
    queryKey: ['admin-navigations'],
    queryFn: async () => {
      const res = await apiFetch('/api/user-management/navigations?limit=100');
      if (!res.ok) throw new Error('Navigasyon menüleri yüklenemedi.');
      return res.json();
    },
  });

  // Hydrate settings
  useEffect(() => {
    if (settingsResponse?.data) {
      const settingsArray = settingsResponse.data;
      const settingsMap = {};
      settingsArray.forEach((item) => {
        settingsMap[item.key] = item.value;
      });

      let frontSettings = settingsMap['frontend.system_settings'] || {};
      if (typeof frontSettings === 'string') {
        try {
          frontSettings = JSON.parse(frontSettings);
        } catch (e) {
          frontSettings = {};
        }
      }

      setAnnouncementActive(!!frontSettings.announcementActive);
      setAnnouncementTextTr(frontSettings.announcementTextTr || '');
      setAnnouncementTextEn(frontSettings.announcementTextEn || '');
      setAnnouncementLink(frontSettings.announcementLink || '');
      setHeaderMenu(frontSettings.headerMenu || '');
      setLogoHeight(String(frontSettings.logoHeight || '40'));
      setHeaderSticky(frontSettings.headerSticky !== false);
      setFooterMenu(frontSettings.footerMenu || '');
      setFooterDescTr(frontSettings.footerDescTr || '');
      setFooterDescEn(frontSettings.footerDescEn || '');
      setNewsletterActive(frontSettings.newsletterActive !== false);
      setFooterShowContact(frontSettings.footerShowContact !== false);
      setFooterShowSocial(frontSettings.footerShowSocial !== false);

      // New Top Bar toggles
      setTopBarContactShow(!!frontSettings.topBarContactShow);
      setTopBarLangShow(!!frontSettings.topBarLangShow);
      setTopBarThemeShow(!!frontSettings.topBarThemeShow);

      // New Countdown states
      setCountdownActive(!!frontSettings.countdownActive);
      setCountdownDate(frontSettings.countdownDate || '');
      setCountdownLabelTr(frontSettings.countdownLabelTr || '');
      setCountdownLabelEn(frontSettings.countdownLabelEn || '');

      // New CTA button states
      setCtaActive(!!frontSettings.ctaActive);
      setCtaTextTr(frontSettings.ctaTextTr || '');
      setCtaTextEn(frontSettings.ctaTextEn || '');
      setCtaLink(frontSettings.ctaLink || '');
      setCtaStyle(frontSettings.ctaStyle || 'gradient');
    }
  }, [settingsResponse]);

  // Mutation for saving settings
  const mutation = useMutation({
    mutationFn: async (updatedFields) => {
      // Get the existing frontend settings first
      const resGet = await apiFetch('/api/admin/settings');
      if (!resGet.ok) throw new Error('Sistem ayarları yüklenemedi.');
      const dataGet = await resGet.json();
      const settingsMap = {};
      (dataGet.data || []).forEach(item => {
        settingsMap[item.key] = item.value;
      });
      let frontSettings = settingsMap['frontend.system_settings'] || {};
      if (typeof frontSettings === 'string') {
        try {
          frontSettings = JSON.parse(frontSettings);
        } catch (e) {
          frontSettings = {};
        }
      }

      // Merge with updated fields
      const merged = { ...frontSettings, ...updatedFields };

      // Put to Next.js API route PUT proxy
      const resPut = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            'frontend.system_settings': merged
          }
        }),
      });

      if (!resPut.ok) {
        throw new Error('Arayüz ayarları güncellenemedi.');
      }
      return resPut.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Arayüz ve Tema ayarları başarıyla güncellendi.</AlertTitle>
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
            <AlertTitle>{err.message || 'Bir hata oluştu'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      announcementActive,
      announcementTextTr: announcementTextTr.trim(),
      announcementTextEn: announcementTextEn.trim(),
      announcementLink: announcementLink.trim(),
      headerMenu,
      logoHeight: parseInt(logoHeight, 10) || 40,
      headerSticky,
      footerMenu,
      footerDescTr: footerDescTr.trim(),
      footerDescEn: footerDescEn.trim(),
      newsletterActive,
      footerShowContact,
      footerShowSocial,
      topBarContactShow,
      topBarLangShow,
      topBarThemeShow,
      countdownActive,
      countdownDate,
      countdownLabelTr: countdownLabelTr.trim(),
      countdownLabelEn: countdownLabelEn.trim(),
      ctaActive,
      ctaTextTr: ctaTextTr.trim(),
      ctaTextEn: ctaTextEn.trim(),
      ctaLink: ctaLink.trim(),
      ctaStyle,
    });
  };

  const isLoading = settingsLoading || navsLoading;
  const navMenus = navsResponse?.data || [];

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Header & Footer Ayarları</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Arayüz Ayarları</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs">Arayüz ayarları yükleniyor...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="header" className="w-full space-y-6">
              {/* Tabs Navigation Card */}
              <Card className="select-none p-3">
                <TabsList variant="line" className="w-full flex-wrap justify-start border-none bg-transparent gap-2 h-auto p-0">
                  <TabsTrigger
                    value="header"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10 animate-fade-in"
                  >
                    <Menu className="size-4" />
                    Header & CTA Ayarları
                  </TabsTrigger>
                  <TabsTrigger
                    value="topbar"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10 animate-fade-in"
                  >
                    <Megaphone className="size-4" />
                    Top Bar & Geri Sayım
                  </TabsTrigger>
                  <TabsTrigger
                    value="footer"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10 animate-fade-in"
                  >
                    <PanelBottom className="size-4" />
                    Footer Ayarları
                  </TabsTrigger>
                </TabsList>
              </Card>

              {/* Header & CTA Settings Tab */}
              <TabsContent value="header" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Header (Başlık) Ayarları</CardTitle>
                    <CardDescription className="text-xs">Web sitesi üst başlığındaki menüyü, logoyu ve yerleşimi yönetin.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Header Menu Select */}
                    <div className="space-y-1.5 max-w-md">
                      <Label htmlFor="header-menu-select" className="text-xs font-semibold text-muted-foreground">
                        Header Navigasyon Menüsü
                      </Label>
                      <Select
                        onValueChange={setHeaderMenu}
                        value={headerMenu}
                      >
                        <SelectTrigger id="header-menu-select">
                          <SelectValue placeholder="Bir menü seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="none_static">Varsayılan Statik Menü (Blog, Hizmetler, vb.)</SelectItem>
                            {navMenus.map((menu) => (
                              <SelectItem key={menu.id} value={menu.key}>
                                {menu.name} ({menu.key})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        "Menü / Navigasyon" ekranında oluşturduğunuz sürükle-bırak menüleri Header'a bağlayın.
                      </p>
                    </div>

                    {/* Logo height dimensions */}
                    <div className="space-y-1.5 max-w-xs">
                      <Label htmlFor="logo-height" className="text-xs font-semibold text-muted-foreground">
                        Logo Yüksekliği (px)
                      </Label>
                      <Input
                        id="logo-height"
                        type="number"
                        min="20"
                        max="120"
                        value={logoHeight}
                        onChange={(e) => setLogoHeight(e.target.value)}
                        placeholder="40"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Sitenin sol üstündeki logonun yükseklik değeri (Varsayılan: 40px).
                      </p>
                    </div>

                    {/* Sticky header toggle */}
                    <div className="flex items-center space-x-4 border border-border rounded-lg p-4 bg-muted/5 max-w-2xl select-none">
                      <Switch
                        id="header-sticky"
                        checked={headerSticky}
                        onCheckedChange={setHeaderSticky}
                      />
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setHeaderSticky(!headerSticky)}>
                        <Label htmlFor="header-sticky" className="text-xs font-bold text-foreground cursor-pointer">
                          Yapışkan Header (Sticky Header)
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Açık olduğunda, sayfa aşağı kaydırılsa dahi menü çubuğu üstte sabit kalır.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Call-to-Action Button Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      Dinamik Aksiyon (CTA) Butonu
                    </CardTitle>
                    <CardDescription className="text-xs">Web sitesinin üst menüsünün en sağında dikkat çekici bir buton gösterilmesini sağlayın.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* CTA Active Switch */}
                    <div className="flex items-center space-x-4 border border-border rounded-lg p-4 bg-muted/5 select-none">
                      <Switch
                        id="cta-active"
                        checked={ctaActive}
                        onCheckedChange={setCtaActive}
                      />
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setCtaActive(!ctaActive)}>
                        <Label htmlFor="cta-active" className="text-xs font-bold text-foreground cursor-pointer">
                          CTA Butonunu Göster
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Header menüsünün en sağında dikkat çekici bir buton ekleyin.
                        </p>
                      </div>
                    </div>

                    {/* CTA Content Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="cta-text-tr" className="text-xs font-semibold text-muted-foreground">
                          Buton Metni (TR)
                        </Label>
                        <Input
                          id="cta-text-tr"
                          value={ctaTextTr}
                          onChange={(e) => setCtaTextTr(e.target.value)}
                          placeholder="Örn: Hemen Keşfet"
                          disabled={!ctaActive}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cta-text-en" className="text-xs font-semibold text-muted-foreground">
                          Buton Metni (EN)
                        </Label>
                        <Input
                          id="cta-text-en"
                          value={ctaTextEn}
                          onChange={(e) => setCtaTextEn(e.target.value)}
                          placeholder="Örn: Explore Now"
                          disabled={!ctaActive}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CTA Target Link */}
                      <div className="space-y-1.5">
                        <Label htmlFor="cta-link" className="text-xs font-semibold text-muted-foreground">
                          Buton Bağlantısı (URL)
                        </Label>
                        <Input
                          id="cta-link"
                          value={ctaLink}
                          onChange={(e) => setCtaLink(e.target.value)}
                          placeholder="Örn: /contact veya dış URL"
                          disabled={!ctaActive}
                        />
                      </div>

                      {/* CTA Button Style Select */}
                      <div className="space-y-1.5">
                        <Label htmlFor="cta-style-select" className="text-xs font-semibold text-muted-foreground">
                          Buton Tasarım Stili
                        </Label>
                        <Select
                          onValueChange={setCtaStyle}
                          value={ctaStyle}
                          disabled={!ctaActive}
                        >
                          <SelectTrigger id="cta-style-select">
                            <SelectValue placeholder="Tasarım Stili Seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="gradient">Vibrant Gradiyent (Premium)</SelectItem>
                              <SelectItem value="pulse">Animasyonlu Pulsing Efekti</SelectItem>
                              <SelectItem value="solid">Standart Dolgulu Buton</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Top Bar & Countdown Tab */}
              <TabsContent value="topbar" className="m-0 space-y-6">
                {/* Advanced Top Bar Toggles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Layout className="size-5 text-primary" />
                      Gelişmiş Top Bar Özellikleri
                    </CardTitle>
                    <CardDescription className="text-xs">Üst bilgi çubuğunda (Top Bar) görüntülenecek sol/sağ alan ayarlarını yönetin.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Top Bar Contact Switch */}
                    <div className="flex items-center space-x-3 border border-border rounded-lg p-4 bg-muted/5 select-none">
                      <Switch
                        id="topbar-contact-show"
                        checked={topBarContactShow}
                        onCheckedChange={setTopBarContactShow}
                      />
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setTopBarContactShow(!topBarContactShow)}>
                        <Label htmlFor="topbar-contact-show" className="text-xs font-bold text-foreground cursor-pointer">
                          İletişim Bilgileri
                        </Label>
                        <p className="text-[9px] text-muted-foreground">
                          Telefon ve e-posta bilgilerini göster.
                        </p>
                      </div>
                    </div>

                    {/* Top Bar Language Selector Switch */}
                    <div className="flex items-center space-x-3 border border-border rounded-lg p-4 bg-muted/5 select-none">
                      <Switch
                        id="topbar-lang-show"
                        checked={topBarLangShow}
                        onCheckedChange={setTopBarLangShow}
                      />
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setTopBarLangShow(!topBarLangShow)}>
                        <Label htmlFor="topbar-lang-show" className="text-xs font-bold text-foreground cursor-pointer">
                          Dil Seçim Kutusu
                        </Label>
                        <p className="text-[9px] text-muted-foreground">
                          TR / EN dil değiştirme menüsünü göster.
                        </p>
                      </div>
                    </div>

                    {/* Top Bar Theme Toggle Switch */}
                    <div className="flex items-center space-x-3 border border-border rounded-lg p-4 bg-muted/5 select-none">
                      <Switch
                        id="topbar-theme-show"
                        checked={topBarThemeShow}
                        onCheckedChange={setTopBarThemeShow}
                      />
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setTopBarThemeShow(!topBarThemeShow)}>
                        <Label htmlFor="topbar-theme-show" className="text-xs font-bold text-foreground cursor-pointer">
                          Tema Değiştirici
                        </Label>
                        <p className="text-[9px] text-muted-foreground">
                          Karanlık/Aydınlık mod ikonunu göster.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Announcement Bar Settings (Sub-Section) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Megaphone className="size-5 text-primary" />
                      Duyuru Yazısı Yönetimi
                    </CardTitle>
                    <CardDescription className="text-xs">Geri sayım etkin değilse, Top Bar ortasında görüntülenecek duyuru/kampanya metnidir.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Announcement Active Switch */}
                    <div className="flex items-center space-x-4 border border-border rounded-lg p-4 bg-muted/5 select-none">
                      <Switch
                        id="announcement-active"
                        checked={announcementActive}
                        onCheckedChange={setAnnouncementActive}
                      />
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setAnnouncementActive(!announcementActive)}>
                        <Label htmlFor="announcement-active" className="text-xs font-bold text-foreground cursor-pointer">
                          Duyuru Yazısını Göster
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Top bar ortasında kayan duyuru barını açıp kapatın (Geri sayım kapalıyken etkindir).
                        </p>
                      </div>
                    </div>

                    {/* Announcement Content Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="announcement-text-tr" className="text-xs font-semibold text-muted-foreground">
                          Duyuru Metni (TR)
                        </Label>
                        <Input
                          id="announcement-text-tr"
                          value={announcementTextTr}
                          onChange={(e) => setAnnouncementTextTr(e.target.value)}
                          placeholder="Örn: Tüm spor etkinliklerinde %20 indirim!"
                          disabled={!announcementActive}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="announcement-text-en" className="text-xs font-semibold text-muted-foreground">
                          Duyuru Metni (EN)
                        </Label>
                        <Input
                          id="announcement-text-en"
                          value={announcementTextEn}
                          onChange={(e) => setAnnouncementTextEn(e.target.value)}
                          placeholder="Örn: 20% off on all sports events!"
                          disabled={!announcementActive}
                        />
                      </div>
                    </div>

                    {/* Announcement Link */}
                    <div className="space-y-1.5 max-w-xl">
                      <Label htmlFor="announcement-link" className="text-xs font-semibold text-muted-foreground">
                        Yönlendirilecek Bağlantı (URL)
                      </Label>
                      <Input
                        id="announcement-link"
                        value={announcementLink}
                        onChange={(e) => setAnnouncementLink(e.target.value)}
                        placeholder="Örn: /services veya dış site URL"
                        disabled={!announcementActive}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Kullanıcı duyuru metnine tıkladığında yönlendirilecek sayfa.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Countdown Timer Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="size-5 text-primary" />
                      Canlı Geri Sayım Sayacı
                    </CardTitle>
                    <CardDescription className="text-xs">Top Bar ortasında, belirli bir kampanya veya etkinliğin bitiş tarihine kadar saniye saniye canlı geri sayım gösterilmesini sağlar.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Countdown Active Switch */}
                    <div className="flex items-center space-x-4 border border-border rounded-lg p-4 bg-muted/5 select-none">
                      <Switch
                        id="countdown-active"
                        checked={countdownActive}
                        onCheckedChange={setCountdownActive}
                      />
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setCountdownActive(!countdownActive)}>
                        <Label htmlFor="countdown-active" className="text-xs font-bold text-foreground cursor-pointer">
                          Geri Sayım Sayacını Göster
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Top bar ortasında canlı geri sayım sayacını aktif edin. (Etkin olduğunda duyuru yazısı yerine bu sayaç gösterilir)
                        </p>
                      </div>
                    </div>

                    {/* Target Date Input */}
                    <div className="space-y-1.5 max-w-xs">
                      <Label htmlFor="countdown-date" className="text-xs font-semibold text-muted-foreground">
                        Bitiş Tarihi & Saat
                      </Label>
                      <Input
                        id="countdown-date"
                        type="datetime-local"
                        value={countdownDate}
                        onChange={(e) => setCountdownDate(e.target.value)}
                        disabled={!countdownActive}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Geri sayım sayacının duracağı hedef tarih ve saati girin.
                      </p>
                    </div>

                    {/* Countdown Prefix Labels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="countdown-label-tr" className="text-xs font-semibold text-muted-foreground">
                          Sayaç Ön Etiketi (TR)
                        </Label>
                        <Input
                          id="countdown-label-tr"
                          value={countdownLabelTr}
                          onChange={(e) => setCountdownLabelTr(e.target.value)}
                          placeholder="Örn: Büyük Kampanyanın Bitmesine Kalan Süre:"
                          disabled={!countdownActive}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="countdown-label-en" className="text-xs font-semibold text-muted-foreground">
                          Sayaç Ön Etiketi (EN)
                        </Label>
                        <Input
                          id="countdown-label-en"
                          value={countdownLabelEn}
                          onChange={(e) => setCountdownLabelEn(e.target.value)}
                          placeholder="Time Left For the Big Campaign:"
                          disabled={!countdownActive}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Footer Settings Tab */}
              <TabsContent value="footer" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Footer (Alt Bilgi) Ayarları</CardTitle>
                    <CardDescription className="text-xs">Web sitesinin alt bölümündeki açıklamaları, kolonları ve bülten formunu yönetin.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Footer Menu Select */}
                    <div className="space-y-1.5 max-w-md">
                      <Label htmlFor="footer-menu-select" className="text-xs font-semibold text-muted-foreground">
                        Footer Navigasyon Menüsü
                      </Label>
                      <Select
                        onValueChange={setFooterMenu}
                        value={footerMenu}
                      >
                        <SelectTrigger id="footer-menu-select">
                          <SelectValue placeholder="Bir menü seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="none_static">Varsayılan Statik Menü (Blog, Hizmetler, vb.)</SelectItem>
                            {navMenus.map((menu) => (
                              <SelectItem key={menu.id} value={menu.key}>
                                {menu.name} ({menu.key})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        Hızlı Linkler kolonu altında görüntülenecek sürükle-bırak menüyü seçin.
                      </p>
                    </div>

                    {/* Footer description text */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="footer-desc-tr" className="text-xs font-semibold text-muted-foreground">
                          Footer Tanıtım Yazısı (TR)
                        </Label>
                        <Textarea
                          id="footer-desc-tr"
                          rows={3}
                          value={footerDescTr}
                          onChange={(e) => setFooterDescTr(e.target.value)}
                          placeholder="Firma logosu altında çıkacak kısa açıklama"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="footer-desc-en" className="text-xs font-semibold text-muted-foreground">
                          Footer Tanıtım Yazısı (EN)
                        </Label>
                        <Textarea
                          id="footer-desc-en"
                          rows={3}
                          value={footerDescEn}
                          onChange={(e) => setFooterDescEn(e.target.value)}
                          placeholder="Firma logosu altında çıkacak kısa açıklama (İngilizce)"
                        />
                      </div>
                    </div>

                    {/* Footer Columns Switch Configs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div className="flex items-center space-x-3 border border-border rounded-lg p-4 bg-muted/5 select-none">
                        <Switch
                          id="newsletter-active"
                          checked={newsletterActive}
                          onCheckedChange={setNewsletterActive}
                        />
                        <div className="space-y-0.5 cursor-pointer" onClick={() => setNewsletterActive(!newsletterActive)}>
                          <Label htmlFor="newsletter-active" className="text-xs font-bold text-foreground cursor-pointer">
                            E-Bülten Kutusu
                          </Label>
                          <p className="text-[9px] text-muted-foreground">
                            Bülten kayıt widget'ını göster.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 border border-border rounded-lg p-4 bg-muted/5 select-none">
                        <Switch
                          id="footer-show-contact"
                          checked={footerShowContact}
                          onCheckedChange={setFooterShowContact}
                        />
                        <div className="space-y-0.5 cursor-pointer" onClick={() => setFooterShowContact(!footerShowContact)}>
                          <Label htmlFor="footer-show-contact" className="text-xs font-bold text-foreground cursor-pointer">
                            İletişim Bilgileri
                          </Label>
                          <p className="text-[9px] text-muted-foreground">
                            Telefon, e-posta ve adres kolonunu göster.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 border border-border rounded-lg p-4 bg-muted/5 select-none">
                        <Switch
                          id="footer-show-social"
                          checked={footerShowSocial}
                          onCheckedChange={setFooterShowSocial}
                        />
                        <div className="space-y-0.5 cursor-pointer" onClick={() => setFooterShowSocial(!footerShowSocial)}>
                          <Label htmlFor="footer-show-social" className="text-xs font-bold text-foreground cursor-pointer">
                            Sosyal Medya Linkleri
                          </Label>
                          <p className="text-[9px] text-muted-foreground">
                            Sosyal medya ikonlarını en altta göster.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Buttons */}
            <div className="flex justify-end gap-2.5">
              <Button
                type="submit"
                className="h-10 text-xs gap-1.5"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Ayarları Kaydet
              </Button>
            </div>
          </form>
        )}
      </Container>
    </>
  );
}
