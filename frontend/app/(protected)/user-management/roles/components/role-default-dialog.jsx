'use client';

import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
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

const RoleDefaultDialog = ({ open, closeDialog, role }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Define the mutation for deleting the role
  const mutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiFetch(
        `/api/user-management/roles/${id}/default`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      const message = t('roles.dialog.success_default', 'Default role set successfully.');
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

      queryClient.invalidateQueries({ queryKey: ['user-roles'] }); // Refetch roles list
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

  const titleText = t('roles.default_dialog.title', { name: role.name, defaultValue: `Change the default role to ${role.name}?` });
  const descText = t('roles.default_dialog.desc', { name: role.name, defaultValue: `New users will be assigned the ${role.name} role by default.` });

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {descText}
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            {t('roles.default_dialog.cancel', 'Cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate(role.id)}
            disabled={mutation.status === 'pending'}
          >
            {mutation.status === 'pending' && (
              <LoaderCircleIcon className="animate-spin" />
            )}
            {t('roles.default_dialog.submit', 'Update default role')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDefaultDialog;
