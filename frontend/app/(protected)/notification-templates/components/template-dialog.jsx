'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

export default function TemplateDialog({ open, closeDialog, template }) {
  const queryClient = useQueryClient();
  const isEdit = !!template;

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState([]);
  
  const [subject, setSubject] = useState('');
  const [mailContent, setMailContent] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [dbContent, setDbContent] = useState('');

  // Default tab selection
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name || '');
        setCode(template.code || '');
        setIsActive(!!template.is_active);
        setSelectedChannels(template.channels || []);
        
        setSubject(template.subject || '');
        setMailContent(template.content?.mail || '');
        setSmsContent(template.content?.sms || '');
        setDbContent(template.content?.database || '');

        // Set initial active tab
        const channels = template.channels || [];
        if (channels.includes('mail')) setActiveTab('mail');
        else if (channels.includes('sms')) setActiveTab('sms');
        else if (channels.includes('database')) setActiveTab('database');
        else setActiveTab('');
      } else {
        setName('');
        setCode('');
        setIsActive(true);
        setSelectedChannels(['mail']); // Default channel
        setSubject('');
        setMailContent('');
        setSmsContent('');
        setDbContent('');
        setActiveTab('mail');
      }
    }
  }, [open, template]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/notifications/templates/${template.id}`
        : '/api/admin/notifications/templates';
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
        throw new Error(errJson.message || 'Şablon kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-templates'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'Şablon başarıyla güncellendi.' : 'Yeni bildirim şablonu oluşturuldu.'}</AlertTitle>
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

  const handleChannelCheckboxChange = (channel, checked) => {
    setSelectedChannels((prev) => {
      let next;
      if (checked) {
        next = [...prev, channel];
      } else {
        next = prev.filter((c) => c !== channel);
      }

      // Automatically adjust active tab if the active one got unchecked
      if (!next.includes(activeTab)) {
        if (next.includes('mail')) setActiveTab('mail');
        else if (next.includes('sms')) setActiveTab('sms');
        else if (next.includes('database')) setActiveTab('database');
        else setActiveTab('');
      } else if (activeTab === '' && next.length > 0) {
        setActiveTab(next[0]);
      }

      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Şablon Adı girmelisiniz.');
      return;
    }

    if (!code.trim()) {
      toast.error('Şablon Kodu girmelisiniz.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(code.trim())) {
      toast.error('Şablon Kodu sadece harf, rakam, alt çizgi (_) ve kısa çizgi (-) içerebilir.');
      return;
    }

    if (selectedChannels.length === 0) {
      toast.error('En az bir bildirim kanalı seçmelisiniz.');
      return;
    }

    // Prepare contents
    const contentPayload = {};
    if (selectedChannels.includes('mail')) {
      contentPayload.mail = mailContent.trim();
    }
    if (selectedChannels.includes('sms')) {
      contentPayload.sms = smsContent.trim();
    }
    if (selectedChannels.includes('database')) {
      contentPayload.database = dbContent.trim();
    }

    const payload = {
      name: name.trim(),
      code: code.trim(),
      channels: selectedChannels,
      subject: selectedChannels.includes('mail') ? subject.trim() : null,
      content: contentPayload,
      is_active: isActive,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-xl w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Bildirim Şablonunu Düzenle' : 'Yeni Bildirim Şablonu Ekle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {/* Split row for Name and Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="template-name" className="text-xs font-semibold text-muted-foreground">
                  Şablon Adı
                </Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Hoş Geldiniz E-postası"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="template-code" className="text-xs font-semibold text-muted-foreground">
                  Benzersiz Şablon Kodu (Code)
                </Label>
                <Input
                  id="template-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Örn: user_welcome_mail"
                  disabled={isEdit}
                />
              </div>
            </div>

            {/* Channels Checklist */}
            <div className="space-y-2 border-t border-border pt-3 select-none">
              <Label className="text-xs font-semibold text-muted-foreground">Gönderim Kanalları</Label>
              <div className="flex gap-6 items-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="channel-mail"
                    checked={selectedChannels.includes('mail')}
                    onCheckedChange={(checked) => handleChannelCheckboxChange('mail', !!checked)}
                  />
                  <Label htmlFor="channel-mail" className="text-xs font-medium cursor-pointer">
                    E-posta (Mail)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="channel-sms"
                    checked={selectedChannels.includes('sms')}
                    onCheckedChange={(checked) => handleChannelCheckboxChange('sms', !!checked)}
                  />
                  <Label htmlFor="channel-sms" className="text-xs font-medium cursor-pointer">
                    SMS (Kısa Mesaj)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="channel-db"
                    checked={selectedChannels.includes('database')}
                    onCheckedChange={(checked) => handleChannelCheckboxChange('database', !!checked)}
                  />
                  <Label htmlFor="channel-db" className="text-xs font-medium cursor-pointer">
                    Sistem Bildirimi (Database)
                  </Label>
                </div>
              </div>
            </div>

            {/* Dynamic Content Tabs */}
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex justify-between items-center select-none">
                <Label className="text-xs font-semibold text-muted-foreground">Kanal İçerikleri</Label>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  <Info className="size-3 text-primary" />
                  Dinamik parametreleri <code>{`{{name}}`}</code> veya <code>{`{{code}}`}</code> şeklinde kullanabilirsiniz.
                </span>
              </div>

              {selectedChannels.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg text-xs text-muted-foreground select-none bg-muted/5">
                  Lütfen yukarıdan en az bir gönderim kanalı seçin.
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full border border-border rounded-lg bg-muted/5 p-4">
                  <TabsList className="justify-start gap-1 mb-4 border-b border-border w-full bg-transparent p-0 rounded-none h-9">
                    {selectedChannels.includes('mail') && (
                      <TabsTrigger value="mail" className="text-xs font-bold px-3 py-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                        E-posta (Mail)
                      </TabsTrigger>
                    )}
                    {selectedChannels.includes('sms') && (
                      <TabsTrigger value="sms" className="text-xs font-bold px-3 py-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                        SMS
                      </TabsTrigger>
                    )}
                    {selectedChannels.includes('database') && (
                      <TabsTrigger value="database" className="text-xs font-bold px-3 py-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                        Sistem Bildirimi
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Mail Channel Tab */}
                  {selectedChannels.includes('mail') && (
                    <TabsContent value="mail" className="mt-0 space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="mail-subject" className="text-xs font-semibold text-muted-foreground">
                          E-posta Konusu (Subject)
                        </Label>
                        <Input
                          id="mail-subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Hoş Geldiniz!"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="mail-body" className="text-xs font-semibold text-muted-foreground">
                          E-posta Gövdesi (HTML/Text)
                        </Label>
                        <Textarea
                          id="mail-body"
                          rows={6}
                          value={mailContent}
                          onChange={(e) => setMailContent(e.target.value)}
                          placeholder="Merhaba {{name}}, aramıza hoş geldiniz..."
                          className="font-mono text-xs"
                        />
                      </div>
                    </TabsContent>
                  )}

                  {/* SMS Channel Tab */}
                  {selectedChannels.includes('sms') && (
                    <TabsContent value="sms" className="mt-0 space-y-1.5">
                      <Label htmlFor="sms-body" className="text-xs font-semibold text-muted-foreground">
                        SMS Mesaj Metni
                      </Label>
                      <Textarea
                        id="sms-body"
                        rows={4}
                        value={smsContent}
                        onChange={(e) => setSmsContent(e.target.value)}
                        placeholder="Sayın {{name}}, doğrulama kodunuz: {{code}}."
                      />
                    </TabsContent>
                  )}

                  {/* Database/System Channel Tab */}
                  {selectedChannels.includes('database') && (
                    <TabsContent value="database" className="mt-0 space-y-1.5">
                      <Label htmlFor="db-body" className="text-xs font-semibold text-muted-foreground">
                        Sistem Bildirim Metni (Database JSON/Text)
                      </Label>
                      <Textarea
                        id="db-body"
                        rows={4}
                        value={dbContent}
                        onChange={(e) => setDbContent(e.target.value)}
                        placeholder="Yeni bildirim aldınız: {{message}}"
                      />
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2.5 select-none pt-2 border-t border-border">
              <Switch id="template-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="template-active" className="text-xs font-semibold cursor-pointer">
                Şablon Aktif (Tetiklenebilir)
              </Label>
            </div>
          </DialogBody>

          <DialogFooter className="select-none">
            <Button type="button" variant="outline" onClick={closeDialog}>
              İptal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
              ) : (
                <Save className="size-4 mr-1.5" />
              )}
              {isEdit ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
