'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PermissionSchema } from '../forms/permission-schema';

const PermissionEditDialog = ({ open, closeDialog, permission }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Form initialization
  const form = useForm({
    resolver: zodResolver(PermissionSchema(t)),
    defaultValues: { name: '', slug: '', description: '' },
    mode: 'onSubmit',
  });

  // Reset form values when dialog is opened
  useEffect(() => {
    if (open) {
      form.reset({
        name: permission?.name || '',
        slug: permission?.slug || '',
        description: permission?.description ?? '',
      });
    }
  }, [form, open, permission]);

  // Mutation for creating/updating permission
  const mutation = useMutation({
    mutationFn: async (values) => {
      const isEdit = !!permission?.id;
      const url = isEdit
        ? `/api/user-management/permissions/${permission.id}`
        : '/api/user-management/permissions';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      const isEdit = !!permission?.id;
      const message = isEdit
        ? t('permissions.dialog.success_edit', 'Permission updated successfully')
        : t('permissions.dialog.success_add', 'Permission added successfully');

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

      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
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

  // Derive the loading state from the mutation status
  const isLoading = mutation.status === 'pending';

  // Handle form submission
  const handleSubmit = (values) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {permission
              ? t('permissions.dialog.edit_title', 'Edit Permission')
              : t('permissions.dialog.add_title', 'Add Permission')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('permissions.dialog.name_label', 'Permission Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('permissions.dialog.name_placeholder', 'Enter permission name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('permissions.dialog.slug_label', 'Slug')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('permissions.dialog.slug_placeholder', 'E.g: users:view')}
                      {...field}
                      disabled={!!permission}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    {t('permissions.dialog.slug_description', 'A unique key for the permission, cannot be edited after creation.')}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('permissions.dialog.description_label', 'Description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('permissions.dialog.description_placeholder', 'Optional description')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                {t('permissions.dialog.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isDirty}
              >
                {isLoading && <LoaderCircleIcon className="animate-spin" />}
                {permission
                  ? t('permissions.dialog.submit_edit', 'Update Permission')
                  : t('permissions.dialog.submit_add', 'Add Permission')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionEditDialog;
