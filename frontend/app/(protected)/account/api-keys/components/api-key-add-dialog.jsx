'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const AVAILABLE_SCOPES = [
  { value: 'content:read', label: 'İçerik Oku (content:read)' },
  { value: 'forms:read', label: 'Formları Oku (forms:read)' },
  { value: 'forms:submit', label: 'Form Gönder (forms:submit)' },
  { value: 'navigation:read', label: 'Menüleri Oku (navigation:read)' },
  { value: 'seo:read', label: 'SEO/Yönlendirmeleri Oku (seo:read)' },
  { value: 'settings:read', label: 'Site Ayarlarını Oku (settings:read)' },
  { value: 'marketing:read', label: 'Pazarlama/Kampanyaları Oku (marketing:read)' },
];

const ApiKeyAddSchema = z.object({
  name: z.string().min(1, 'Lütfen bir anahtar ismi girin.'),
  scopes: z.array(z.string()).min(1, 'Lütfen en az bir yetki alanı seçin.'),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export default function ApiKeyAddDialog({ open, closeDialog }) {
  const queryClient = useQueryClient();
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const form = useForm({
    resolver: zodResolver(ApiKeyAddSchema),
    defaultValues: {
      name: '',
      scopes: [],
      expires_at: '',
      is_active: true,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setGeneratedKey(null);
      setCopied(false);
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await apiFetch('/api/user-management/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          expires_at: values.expires_at || null,
        }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || 'Anahtar oluşturulurken bir hata oluştu.');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Set generated key to trigger raw key view
      const raw = data.data?.raw_key;
      setGeneratedKey(raw);

      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>API Anahtarı başarıyla üretildi.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );

      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const isProcessing = mutation.status === 'pending';

  const handleSubmit = (values) => {
    mutation.mutate(values);
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast.success('API Anahtarı kopyalandı.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : closeDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {generatedKey ? 'API Anahtarı Hazır' : 'Yeni API Anahtarı Üret'}
          </DialogTitle>
        </DialogHeader>

        {generatedKey ? (
          // Success & Raw Key Display View
          <DialogBody className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              API anahtarınız başarıyla üretilmiştir. Güvenlik nedeniyle bu anahtar size <strong>sadece bir kez</strong> gösterilecektir. Lütfen şimdi kopyalayın ve güvenli bir yerde saklayın.
            </p>

            <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="font-mono text-sm break-all select-all flex-1 text-gray-800 dark:text-gray-200">
                {generatedKey}
              </span>
              <Button
                variant="dim"
                mode="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-warning/10 text-warning text-xs border border-warning/20">
              <strong>Uyarı:</strong> Bu pencereyi kapattıktan sonra anahtarı bir daha görüntüleyemeyeceksiniz!
            </div>

            <DialogFooter>
              <Button className="w-full" onClick={handleFinish}>
                Tamam, Kaydettim
              </Button>
            </DialogFooter>
          </DialogBody>
        ) : (
          // Form View
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <DialogBody className="space-y-5">
                {/* Key Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anahtar İsmi (Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Frontend Mobil Uygulaması" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiration Date */}
                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geçerlilik Tarihi (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Scopes */}
                <div className="space-y-2">
                  <FormLabel>Yetki Alanları (Scopes)</FormLabel>
                  <FormField
                    control={form.control}
                    name="scopes"
                    render={() => (
                      <FormItem className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {AVAILABLE_SCOPES.map((scope) => (
                          <FormField
                            key={scope.value}
                            control={form.control}
                            name="scopes"
                            render={({ field }) => {
                              const checked = field.value?.includes(scope.value);
                              return (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(checkedState) => {
                                        const newValue = checkedState
                                          ? [...(field.value || []), scope.value]
                                          : field.value?.filter((v) => v !== scope.value) || [];
                                        field.onChange(newValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer select-none text-xs">
                                    {scope.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isProcessing}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing && <Loader2 size={16} className="mr-2 animate-spin" />}
                  Üret
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
