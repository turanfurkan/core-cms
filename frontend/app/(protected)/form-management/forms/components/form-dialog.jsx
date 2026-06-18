'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Plus, Trash2, ArrowUp, ArrowDown, Settings } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RightDrawer } from '@/components/common/right-drawer';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

const FIELD_TYPES = [
  { value: 'text', label: 'Kısa Metin (Text)' },
  { value: 'textarea', label: 'Uzun Metin (Textarea)' },
  { value: 'email', label: 'E-posta (Email)' },
  { value: 'number', label: 'Sayı (Number)' },
  { value: 'date', label: 'Tarih (Date)' },
  { value: 'select', label: 'Açılır Seçim (Select)' },
  { value: 'checkbox', label: 'Çoklu Seçim (Checkbox)' },
  { value: 'radio', label: 'Tekli Seçim (Radio)' },
  { value: 'file', label: 'Dosya Yükleme (File)' },
];

export default function FormDialog({ open, closeDialog, form }) {
  const queryClient = useQueryClient();
  const isEdit = !!form;

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (open) {
      if (form) {
        setTitle(form.title || '');
        setSlug(form.slug || '');
        setDescription(form.description || '');
        setRecipientEmail(form.recipient_email || '');
        setIsActive(form.is_active ?? true);
        setFields(
          (form.fields || []).map((f) => ({
            id: f.id || Math.random().toString(36).substr(2, 9),
            type: f.type || 'text',
            name: f.name || '',
            label: f.label || '',
            placeholder: f.placeholder || '',
            is_required: !!f.is_required,
            options: f.options || [],
            optionsInput: (f.options || []).join(', '),
            validation_rules: f.validation_rules || [],
            order: f.order || 0,
          }))
        );
      } else {
        setTitle('');
        setSlug('');
        setDescription('');
        setRecipientEmail('');
        setIsActive(true);
        setFields([]);
      }
    }
  }, [open, form]);

  const handleAddField = () => {
    const tempId = Math.random().toString(36).substr(2, 9);
    setFields((prev) => [
      ...prev,
      {
        id: tempId,
        type: 'text',
        name: '',
        label: '',
        placeholder: '',
        is_required: false,
        options: [],
        optionsInput: '',
        validation_rules: [],
        order: prev.length,
      },
    ]);
  };

  const handleRemoveField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFieldChange = (id, key, val) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;

        const updated = { ...f, [key]: val };

        // Auto name generator from label
        if (key === 'label' && !f.name) {
          updated.name = val
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
        }

        // Parse options from comma-separated string
        if (key === 'optionsInput') {
          updated.options = val
            .split(',')
            .map((o) => o.trim())
            .filter((o) => o.length > 0);
        }

        return updated;
      })
    );
  };

  const moveField = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= fields.length) return;

    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;

    // Recalculate orders
    const ordered = updated.map((f, i) => ({ ...f, order: i }));
    setFields(ordered);
  };

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit ? `/api/admin/forms/${form.id}` : '/api/api/admin/forms'; // Wait, let's make sure the prefix matches `/api/admin/forms` wrapper!
      const finalUrl = isEdit ? `/api/admin/forms/${form.id}` : '/api/admin/forms';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(finalUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Form kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'Form şeması başarıyla güncellendi.' : 'Yeni form başarıyla oluşturuldu.'}</AlertTitle>
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

    if (!title.trim()) {
      toast.error('Form Başlığı gereklidir.');
      return;
    }

    if (!slug.trim()) {
      toast.error('Form Slug gereklidir.');
      return;
    }

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.label.trim()) {
        toast.error(`${i + 1}. alan için "Etiket (Label)" girmelisiniz.`);
        return;
      }
      if (!f.name.trim()) {
        toast.error(`${i + 1}. alan için "Sistem Adı (Name)" girmelisiniz.`);
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(f.name)) {
        toast.error(`${i + 1}. alan sistem adı sadece İngilizce karakter, sayı ve alt çizgi içerebilir.`);
        return;
      }
      if (['select', 'checkbox', 'radio'].includes(f.type) && f.options.length === 0) {
        toast.error(`"${f.label}" alanı için en az bir seçenek belirtmelisiniz.`);
        return;
      }
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      recipient_email: recipientEmail.trim() || null,
      is_active: isActive,
      fields: fields.map((f, idx) => ({
        type: f.type,
        name: f.name.trim(),
        label: f.label.trim(),
        placeholder: f.placeholder.trim() || null,
        is_required: f.is_required,
        options: f.options,
        validation_rules: f.validation_rules,
        order: idx,
      })),
    };

    mutation.mutate(payload);
  };

  const footerContent = (
    <>
      <Button type="button" variant="outline" onClick={closeDialog}>
        İptal
      </Button>
      <Button type="submit" form="form-builder-form" disabled={mutation.isPending}>
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
      title={isEdit ? `Formu Düzenle: ${form.title}` : 'Yeni Dinamik Form Oluştur'}
      size="4xl"
      footer={footerContent}
    >
      <form id="form-builder-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Core Form Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="form-title" className="text-xs font-semibold text-muted-foreground">
              Form Başlığı
            </Label>
            <Input
              id="form-title"
              type="text"
              placeholder="Örn: İletişim Formu"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEdit && !slug) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9 -]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-')
                  );
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-slug" className="text-xs font-semibold text-muted-foreground">
              Form Slug (URL Kodu)
            </Label>
            <Input
              id="form-slug"
              type="text"
              placeholder="iletisim-formu"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="form-desc" className="text-xs font-semibold text-muted-foreground">
              Açıklama (Opsiyonel)
            </Label>
            <Textarea
              id="form-desc"
              rows={2}
              placeholder="Formun kullanım amacı veya açıklaması..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-email" className="text-xs font-semibold text-muted-foreground">
              Alıcı E-posta Adresi (Bildirimler için)
            </Label>
            <Input
              id="form-email"
              type="email"
              placeholder="info@sporfest.com.tr"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-6 pl-1 select-none">
            <Switch id="form-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="form-active" className="text-sm font-semibold cursor-pointer">
              Form Aktif (Kullanıma Açık)
            </Label>
          </div>
        </div>

        <hr className="border-border" />

        {/* Form Fields Builder Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between select-none">
            <div>
              <h3 className="text-sm font-bold text-foreground">Form Alanları (Fields Schema)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kullanıcıların bu formda dolduracağı girdileri yapılandırın.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddField} className="gap-1.5">
              <Plus className="size-4" />
              Alan Ekle
            </Button>
          </div>

          {/* Fields list */}
          <div className="space-y-3">
            {fields.map((field, index) => {
              const showOptions = ['select', 'checkbox', 'radio'].includes(field.type);

              return (
                <div
                  key={field.id}
                  className="p-4 border border-border rounded-xl bg-muted/5 flex flex-col gap-3 relative group transition-all hover:bg-muted/10 hover:border-primary/20"
                >
                  {/* Action Reordering and Deletion Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-bold text-muted-foreground font-mono">
                      #{index + 1} - {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={index === 0}
                        onClick={() => moveField(index, -1)}
                        className="h-6 w-6 p-0 hover:bg-muted"
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={index === fields.length - 1}
                        onClick={() => moveField(index, 1)}
                        className="h-6 w-6 p-0 hover:bg-muted"
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemoveField(field.id)}
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Core Properties Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground">Alan Türü (Type)</Label>
                      <Select
                        value={field.type}
                        onValueChange={(val) => handleFieldChange(field.id, 'type', val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground">Etiket (Label)</Label>
                      <Input
                        type="text"
                        placeholder="Örn: Adınız Soyadınız"
                        value={field.label}
                        onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground">
                        Sistem Adı (Name - Harfler/Alt Çizgi)
                      </Label>
                      <Input
                        type="text"
                        placeholder="adi_soyadi"
                        value={field.name}
                        onChange={(e) =>
                          handleFieldChange(
                            field.id,
                            'name',
                            e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Secondary Fields Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-[10px] font-bold text-muted-foreground">İpucu Yazısı (Placeholder)</Label>
                      <Input
                        type="text"
                        placeholder="Kullanıcıya gösterilecek kılavuz yazısı..."
                        value={field.placeholder}
                        onChange={(e) => handleFieldChange(field.id, 'placeholder', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4 pl-1 select-none">
                      <Switch
                        id={`req-${field.id}`}
                        checked={field.is_required}
                        onCheckedChange={(val) => handleFieldChange(field.id, 'is_required', val)}
                      />
                      <Label htmlFor={`req-${field.id}`} className="text-xs font-semibold cursor-pointer">
                        Zorunlu Alan
                      </Label>
                    </div>
                  </div>

                  {/* Multi-choices Options inputs */}
                  {showOptions && (
                    <div className="space-y-1 p-3 bg-muted/20 border border-border/80 rounded-lg">
                      <Label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Settings className="size-3" /> Seçenekler (Virgülle ayırarak girin)
                      </Label>
                      <Input
                        type="text"
                        placeholder="Örn: Seçenek 1, Seçenek 2, Seçenek 3"
                        value={field.optionsInput}
                        onChange={(e) => handleFieldChange(field.id, 'optionsInput', e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground font-medium pl-1 select-none">
                        Mevcut Seçenekler: {field.options.length > 0 ? field.options.map(o => `"${o}"`).join(', ') : 'Hiçbiri'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {fields.length === 0 && (
              <div className="text-center py-10 border border-dashed border-border rounded-xl select-none">
                <p className="text-xs text-muted-foreground">Henüz form alanı eklenmedi.</p>
                <Button type="button" variant="outline" size="sm" onClick={handleAddField} className="mt-2.5 gap-1.5">
                  <Plus className="size-4" /> İlk Alanı Ekle
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>
    </RightDrawer>
  );
}
