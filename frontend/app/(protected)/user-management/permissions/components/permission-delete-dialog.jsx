'use client';

import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PermissionDeleteDialog = ({ open, closeDialog, permission }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Define the mutation for deleting the permission
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(
        `/api/user-management/permissions/${permission.id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      const message = t('permissions.dialog.success_delete', 'Permission deleted successfully');

      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),

        {
          position: 'top-center',
        },
      );

      queryClient.invalidateQueries({ queryKey: ['user-permissions'] }); // Refetch permissions list
      closeDialog();
    },
    onError: (error) => {
      const message = error.message;
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),

        {
          position: 'top-center',
        },
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('permissions.delete_dialog.title', 'Confirm Delete')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t('permissions.delete_dialog.desc', 'Are you sure you want to delete the permission {{name}}?', { name: permission?.name })}
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            <X />
            {t('permissions.delete_dialog.cancel', 'Cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.status === 'pending'}
          >
            {mutation.status === 'pending' ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <Trash2 />
            )}
            {t('permissions.delete_dialog.delete', 'Delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionDeleteDialog;
