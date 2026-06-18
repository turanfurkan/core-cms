'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function FolderDialog({ open, closeDialog, folder, parentId }) {
  const queryClient = useQueryClient();
  const isEdit = !!folder;
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName(folder?.name || '');
    }
  }, [open, folder]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit
        ? `/api/admin/media/folders/${folder.id}`
        : '/api/admin/media/folders';
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
        throw new Error(errJson.message || 'Klasör kaydedilemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media-folders'] });
      // Invalidate the parent folder resource too if we are inside a folder
      if (parentId && parentId !== 'root') {
        queryClient.invalidateQueries({ queryKey: ['admin-media-folder-detail', String(parentId)] });
      }
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{isEdit ? 'Klasör adı güncellendi.' : 'Yeni klasör başarıyla oluşturuldu.'}</AlertTitle>
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
            <AlertTitle>{err.message || 'Klasör işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>Klasör adı boş olamaz.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      return;
    }

    const payload = {
      name: name.trim(),
    };

    if (!isEdit) {
      // If parentId is root, pass null to the backend for parent_id
      payload.parent_id = parentId === 'root' ? null : parseInt(parentId, 10);
    }

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Klasörü Yeniden Adlandır' : 'Yeni Klasör Oluştur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="folder-name" className="text-xs font-semibold text-muted-foreground">
                Klasör Adı
              </Label>
              <Input
                id="folder-name"
                type="text"
                placeholder="Örn: Galeriler, Kampanyalar..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
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
