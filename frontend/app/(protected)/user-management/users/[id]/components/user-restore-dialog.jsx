'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon, X, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
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

// Validation schema for email confirmation
const EmailConfirmationSchema = (userEmail, t) =>
  z.object({
    confirmEmail: z
      .string()
      .nonempty({ message: t('users.validation.email_required', 'Email is required.') })
      .email({ message: t('users.validation.email_invalid', 'Please enter a valid email address.') })
      .refine((value) => value === userEmail, {
        message: t('users.validation.email_mismatch', 'Email confirmation does not match.'),
      }),
  });

const UserRestoreDialog = ({ open, closeDialog, user }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Set up the form using react-hook-form and zod validation
  const form = useForm({
    resolver: zodResolver(EmailConfirmationSchema(user.email, t)),
    defaultValues: {
      confirmEmail: '',
    },
    mode: 'onChange',
  });

  // Define the mutation for restoring the user
  const mutation = useMutation({
    mutationFn: async () => {
      // Call the restore endpoint (adjust the endpoint/method as needed)
      const response = await apiFetch(
        `/api/user-management/users/${user.id}/restore`,
        {
          method: 'PATCH',
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      const message = t('users.details.danger_zone.restore_success', 'User restored successfully.');
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

      // Update user data
      queryClient.invalidateQueries({ queryKey: ['user-user'] });

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

  const handleSubmit = () => {
    mutation.mutate();
  };

  const restoreDesc = t('users.details.danger_zone.restore_dialog_desc', { email: user.email, defaultValue: `Restoring user ${user.email} will reactivate the account and all related data.` });
  const descParts = restoreDesc.split(user.email);

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('users.details.danger_zone.restore_dialog_title', 'Confirm Restore')}</DialogTitle>
        </DialogHeader>
        <div>
          <p className="text-sm text-accent-foreground mb-2.5">
            {descParts[0]}
            <strong className="text-foreground">{user.email}</strong>
            {descParts[1] || ''}
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-2.5 pt-2.5"
            >
              <FormField
                control={form.control}
                name="confirmEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">
                      {t('users.details.danger_zone.restore_confirm_label', "Confirm the user's email address to proceed")}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('users.details.danger_zone.restore_confirm_placeholder', 'Enter email address')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>
                  <X />
                  {t('users.details.edit_dialog.cancel', 'Cancel')}
                </Button>
                <Button
                  variant="destructive"
                  type="submit"
                  disabled={
                    !form.formState.isDirty ||
                    !form.formState.isValid ||
                    mutation.status === 'pending'
                  }
                >
                  {mutation.status === 'pending' ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <RotateCcw />
                  )}
                  {t('users.details.danger_zone.restore_confirm_button', 'Restore user account')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRestoreDialog;
