'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

export default function RedirectDialog({ open, closeDialog, redirect }) {
  const queryClient = useQueryClient();
  const isEdit = !!redirect;

  // Form states
  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [statusCode, setStatusCode] = useState('301');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      if (redirect) {
        setSourcePath(redirect.source_path || '');
        setTargetPath(redirect.target_path || '');
        setStatusCode(String(redirect.status_code || 301));
        setIsActive(redirect.is_active ?? true);
      } else {
        setSourcePath('');
        setTargetPath('');
        setStatusCode('301');
        setIsActive(true);
      }
    }
  }, [open, redirect]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/seo/redirects/${redirect.id}`
        : '/api/admin/seo/redirects';
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
        throw new Error(errJson.message || 'Yönlendirme kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seo-redirects'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'Yönlendirme güncellendi.' : 'Yeni yönlendirme başarıyla oluşturuldu.'}</AlertTitle>
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
            <AlertTitle>{err.message || 'Yönlendirme işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!sourcePath.trim()) {
      toast.error('Kaynak yol boş bırakılamaz.');
      return;
    }

    if (!targetPath.trim()) {
      toast.error('Hedef yol boş bırakılamaz.');
      return;
    }

    // Validate slash formatting
    if (!sourcePath.startsWith('/')) {
      toast.error('Kaynak yol eğik çizgi (/) ile başlamalıdır.');
      return;
    }

    if (!targetPath.startsWith('/')) {
      toast.error('Hedef yol eğik çizgi (/) ile başlamalıdır.');
      return;
    }

    // Regex check
    const pathRegex = /^\/[a-zA-Z0-9_\-\/]*$/;
    if (!pathRegex.test(sourcePath.trim())) {
      toast.error('Kaynak yol geçersiz karakterler barındırıyor.');
      return;
    }

    if (!pathRegex.test(targetPath.trim())) {
      toast.error('Hedef yol geçersiz karakterler barındırıyor.');
      return;
    }

    if (sourcePath.trim() === targetPath.trim()) {
      toast.error('Kaynak yol ile hedef yol aynı olamaz.');
      return;
    }

    const payload = {
      source_path: sourcePath.trim(),
      target_path: targetPath.trim(),
      status_code: parseInt(statusCode, 10),
      is_active: isActive,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Yönlendirmeyi Düzenle' : 'Yeni Yönlendirme Ekle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {/* Source Path */}
            <div className="space-y-1.5">
              <Label htmlFor="source-path" className="text-xs font-semibold text-muted-foreground">
                Kaynak Yol (Eski URL - "/" ile başlamalıdır)
              </Label>
              <Input
                id="source-path"
                type="text"
                placeholder="Örn: /eski-hakkimizda-sayfasi"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
              />
            </div>

            {/* Target Path */}
            <div className="space-y-1.5">
              <Label htmlFor="target-path" className="text-xs font-semibold text-muted-foreground">
                Hedef Yol (Yeni URL - "/" ile başlamalıdır)
              </Label>
              <Input
                id="target-path"
                type="text"
                placeholder="Örn: /hakkimizda"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
              />
            </div>

            {/* Status Code */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Yönlendirme Tipi (HTTP Status)
              </Label>
              <Select value={statusCode} onValueChange={setStatusCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 - Kalıcı Yönlendirme (Permanent)</SelectItem>
                  <SelectItem value="302">302 - Geçici Yönlendirme (Temporary)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Is Active Switch */}
            <div className="flex items-center gap-3 pt-3 pl-0.5 select-none">
              <Switch id="redirect-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="redirect-active" className="text-sm font-semibold cursor-pointer">
                Yönlendirme Aktif (Kullanımda)
              </Label>
            </div>
          </DialogBody>

          <DialogFooter>
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
