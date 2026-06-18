'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RightDrawer } from '@/components/common/right-drawer';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

export default function TranslationDialog({ open, closeDialog, translation }) {
  const queryClient = useQueryClient();
  const isEdit = !!translation;

  // Form states
  const [group, setGroup] = useState('');
  const [key, setKey] = useState('');
  const [textValues, setTextValues] = useState({});

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

  const languages = languagesResponse || [{ id: 1, name: 'Türkçe', code: 'tr' }];

  useEffect(() => {
    if (open) {
      if (translation) {
        setGroup(translation.group || '');
        setKey(translation.key || '');
        setTextValues(translation.text || {});
      } else {
        setGroup('messages');
        setKey('');
        setTextValues({});
      }
    }
  }, [open, translation]);

  const handleTextChange = (langCode, val) => {
    setTextValues((prev) => ({
      ...prev,
      [langCode]: val,
    }));
  };

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch('/api/admin/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Çeviri kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-translations'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'Çeviri metni güncellendi.' : 'Yeni çeviri anahtarı oluşturuldu.'}</AlertTitle>
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

    if (!key.trim()) {
      toast.error('Çeviri Anahtarı (Key) girmelisiniz.');
      return;
    }

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(key.trim())) {
      toast.error('Çeviri anahtarı sadece İngilizce karakter, sayı, alt çizgi, tire ve nokta barındırabilir.');
      return;
    }

    // Validate that at least one translation text is entered
    const textEntered = Object.values(textValues).some((v) => v && v.trim().length > 0);
    if (!textEntered) {
      toast.error('Lütfen en az bir dil için çeviri karşılığı giriniz.');
      return;
    }

    const payload = {
      group: group.trim() || 'messages',
      key: key.trim(),
      text: textValues,
    };

    mutation.mutate(payload);
  };

  const footerContent = (
    <>
      <Button type="button" variant="outline" onClick={closeDialog}>
        İptal
      </Button>
      <Button type="submit" form="translation-form" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
        ) : (
          <Save className="size-4 mr-1.5" />
        )}
        Kaydet
      </Button>
    </>
  );

  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={isEdit ? `Çeviriyi Düzenle: ${translation.key}` : 'Yeni Kelime Çevirisi Ekle'}
      size="2xl"
      footer={footerContent}
    >
      {isLangLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <form id="translation-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Group */}
          <div className="space-y-1.5">
            <Label htmlFor="translation-group" className="text-xs font-semibold text-muted-foreground">
              Çeviri Grubu (Group)
            </Label>
            <Input
              id="translation-group"
              type="text"
              placeholder="Örn: messages, validation, frontend (Varsayılan: messages)"
              value={group}
              onChange={(e) => setGroup(e.target.value.toLowerCase().replace(/[^a-z0-9_\-\.]/g, ''))}
            />
          </div>

          {/* Key */}
          <div className="space-y-1.5">
            <Label htmlFor="translation-key" className="text-xs font-semibold text-muted-foreground">
              Çeviri Anahtarı (Key)
            </Label>
            <Input
              id="translation-key"
              type="text"
              placeholder="Örn: welcome_title veya button.submit"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={isEdit} // Disable editing the key string to maintain integrity of code references
            />
            {isEdit && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 select-none">
                <AlertTriangle className="size-3 text-amber-500" /> Çeviri anahtarları güncellenemez. Yeni bir anahtar kullanmak için yenisini oluşturabilirsiniz.
              </p>
            )}
          </div>

          <hr className="border-border" />

          {/* Translation Texts Per Language */}
          <div className="space-y-4">
            <div className="select-none">
              <h3 className="text-sm font-bold text-foreground">Dil Karşılıkları (Translation Texts)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Sistemde tanımlı diller için karşılık değerlerini girin.</p>
            </div>

            <div className="space-y-4">
              {languages.map((lang) => (
                <div key={lang.code} className="space-y-1.5 border border-border/40 p-3 rounded-lg bg-muted/5">
                  <Label htmlFor={`text-${lang.code}`} className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 select-none">
                    {lang.name} ({lang.code.toUpperCase()}) Karşılığı
                  </Label>
                  <Textarea
                    id={`text-${lang.code}`}
                    rows={2}
                    placeholder={`${lang.name} dilindeki çeviri karşılığı metin...`}
                    value={textValues[lang.code] || ''}
                    onChange={(e) => handleTextChange(lang.code, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
      )}
    </RightDrawer>
  );
}
