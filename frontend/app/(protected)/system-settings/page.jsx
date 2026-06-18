'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Lock
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

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();

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

  // Fetch settings
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/settings');
      if (!res.ok) throw new Error('Sistem ayarları yüklenemedi.');
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
        throw new Error(errJson.message || 'Ayarlar güncellenemedi.');
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
            <AlertTitle>Sistem ve firma ayarları başarıyla güncellendi.</AlertTitle>
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
            <AlertTitle>{err.message || 'İşlem başarısız.'}</AlertTitle>
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
        toast.error('Logo dosyası 1MB\'den küçük olmalıdır.');
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
      toast.error('Site Adı alanlarını (TR ve EN) girmelisiniz.');
      return;
    }

    if (contactEmail.trim() && !/\S+@\S+\.\S+/.test(contactEmail.trim())) {
      toast.error('Geçerli bir iletişim e-posta adresi girin.');
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

    mutation.mutate(formData);
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Genel Sistem ve Firma Ayarları</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sistem Ayarları</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground select-none">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs">Sistem ayarları yükleniyor...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="general" className="w-full space-y-6">
              {/* Tab Header Card */}
              <Card className="select-none p-3">
                <TabsList variant="line" className="w-full flex-wrap justify-start border-none bg-transparent gap-2 h-auto p-0">
                  <TabsTrigger
                    value="general"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Globe className="size-4" />
                    Genel Bilgiler
                  </TabsTrigger>
                  <TabsTrigger
                    value="contact"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Phone className="size-4" />
                    İletişim Bilgileri
                  </TabsTrigger>
                  <TabsTrigger
                    value="social"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Share2 className="size-4" />
                    Sosyal Medya
                  </TabsTrigger>
                  <TabsTrigger
                    value="system"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Bolt className="size-4" />
                    Bakım Modu
                  </TabsTrigger>
                  <TabsTrigger
                    value="mail"
                    className="text-xs font-bold gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10"
                  >
                    <Mail className="size-4" />
                    Mail Sunucusu (SMTP)
                  </TabsTrigger>
                </TabsList>
              </Card>

              {/* General Tab */}
              <TabsContent value="general" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Genel Site ve Firma Tanımları</CardTitle>
                    <CardDescription className="text-xs">Web sitenizin ana başlığını, açıklamasını ve logosunu buradan güncelleyin.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Site name split columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="site-name-tr" className="text-xs font-semibold text-muted-foreground">
                          Site Adı (TR)
                        </Label>
                        <Input
                          id="site-name-tr"
                          value={nameTr}
                          onChange={(e) => setNameTr(e.target.value)}
                          placeholder="Örn: CoreCMS"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="site-name-en" className="text-xs font-semibold text-muted-foreground">
                          Site Adı (EN)
                        </Label>
                        <Input
                          id="site-name-en"
                          value={nameEn}
                          onChange={(e) => setNameEn(e.target.value)}
                          placeholder="Örn: CoreCMS Headless"
                        />
                      </div>
                    </div>

                    {/* Site desc split columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="site-desc-tr" className="text-xs font-semibold text-muted-foreground">
                          Site Açıklaması (TR)
                        </Label>
                        <Textarea
                          id="site-desc-tr"
                          rows={3}
                          value={descTr}
                          onChange={(e) => setDescTr(e.target.value)}
                          placeholder="Ziyaretçiler için sitenizin genel tanımı"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="site-desc-en" className="text-xs font-semibold text-muted-foreground">
                          Site Açıklaması (EN)
                        </Label>
                        <Textarea
                          id="site-desc-en"
                          rows={3}
                          value={descEn}
                          onChange={(e) => setDescEn(e.target.value)}
                          placeholder="Ziyaretçiler için sitenizin genel tanımı (İngilizce)"
                        />
                      </div>
                    </div>

                    {/* Logo Management */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <Label className="text-xs font-semibold text-muted-foreground">Firma Logosu</Label>
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
                              Görsel Seç
                            </Button>
                            {logoAttachedPreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs"
                                onClick={handleCancelLogo}
                              >
                                İptal
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
                                Kaldır
                              </Button>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Desteklenen formatlar: PNG, JPG, WEBP. Maksimum boyut: 1MB.
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">İletişim Bilgileri</CardTitle>
                    <CardDescription className="text-xs">Sistem geneli bildirimler ve iletişim bilgileri</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5 max-w-md">
                      <Label htmlFor="contact-phone" className="text-xs font-semibold text-muted-foreground">
                        Telefon Numarası
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
                        E-posta Adresi
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="info@siteniz.com"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Social Tab */}
              <TabsContent value="social" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Sosyal Medya Linkleri</CardTitle>
                    <CardDescription className="text-xs">Firma sosyal medya profillerini entegre edin.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="social-facebook" className="text-xs font-semibold text-muted-foreground">
                        Facebook Sayfası URL
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
                        Twitter / X Sayfası URL
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
                        Instagram Sayfası URL
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
                    <CardTitle className="text-base font-bold">Sistem ve Bakım Modu</CardTitle>
                    <CardDescription className="text-xs">Web sitesini geçici olarak ziyaretçilere kapatma ayarı.</CardDescription>
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
                          Sistem Bakım Modu (Maintenance Mode)
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Bakım modunu aktif ederseniz, web sitenizin ön yüzü ziyaretçilere geçici olarak kapatılacak ve bilgi ekranı gösterilecektir. Yöneticiler panele erişmeye devam edebilir.
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
                      E-posta Sunucu Bağlantısı (SMTP)
                    </CardTitle>
                    <CardDescription className="text-xs">Sistemin otomatik bilgi ve şifre sıfırlama e-postaları göndermesi için sunucu bilgilerini girin.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="mail-host" className="text-xs font-semibold text-muted-foreground">
                        SMTP Sunucu Adresi (Host)
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
                        SMTP Port
                      </Label>
                      <Input
                        id="mail-port"
                        type="number"
                        value={mailPort}
                        onChange={(e) => setMailPort(e.target.value)}
                        placeholder="587, 465 vb."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="mail-user" className="text-xs font-semibold text-muted-foreground">
                        SMTP Kullanıcı Adı (Username)
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
                        SMTP Şifresi (Password)
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

              {/* Action Save Button */}
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
                  Ayarları Kaydet
                </Button>
              </div>
            </Tabs>
          </form>
        )}
      </Container>
    </>
  );
}
