'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon, Check, X, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RightDrawer } from '@/components/common/right-drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRoleSelectQuery } from '../../../roles/hooks/use-role-select-query';
import { UserStatusProps } from '../../constants/status';
import { UserProfileSchema } from '../forms/user-profile-schema';

const UserProfileEditDialog = ({ open, closeDialog, user }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch available roles
  const { data: roleList } = useRoleSelectQuery();

  const form = useForm({
    resolver: zodResolver(UserProfileSchema(t)),
    defaultValues: {
      name: user?.name || '',
      roleId: user?.roleId || '',
      status: user?.status || '',
      phone: user?.phone || '',
      password: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: user?.name || '',
        roleId: user?.roleId || '',
        status: user?.status || '',
        phone: user?.phone || '',
        password: '',
      });
    }
  }, [open, user, form]);

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/api/user-management/users/${user.id}/reset-password`, {
        method: 'POST',
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: (data) => {
      const message = data.message === 'passwords.sent'
        ? t('users.details.reset_dialog.success_message', 'Şifre sıfırlama e-postası başarıyla gönderildi.')
        : t(data.message, data.message);

      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
    onError: (error) => {
      let errorMsg = error.message;
      if (errorMsg === 'passwords.throttled') {
        errorMsg = t('users.validation.password_throttled', 'Lütfen tekrar denemeden önce biraz bekleyin.');
      } else if (errorMsg === 'passwords.user') {
        errorMsg = t('users.validation.password_user', 'Bu e-posta adresine sahip bir kullanıcı bulunamadı.');
      } else {
        errorMsg = t(errorMsg, errorMsg);
      }

      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{errorMsg}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await apiFetch(`/api/user-management/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      const message = t('users.details.edit_dialog.success_message', 'User updated successfully');

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

      queryClient.invalidateQueries({ queryKey: ['user-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-user'] });
      closeDialog();
    },
    onError: (error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        ),

        {
          position: 'top-center',
        },
      );
    },
  });

  const isProcessing = mutation.status === 'pending';

  const handleSubmit = (values) => {
    mutation.mutate(values);
  };

  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={t('users.details.edit_dialog.title', 'Edit User Details')}
      footer={
        <>
          <Button type="button" variant="outline" onClick={closeDialog}>
            <X />
            {t('users.details.edit_dialog.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            form="user-profile-edit-form"
            disabled={!form.formState.isDirty || isProcessing}
          >
            {isProcessing ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <Check />
            )}
            {t('users.details.edit_dialog.save', 'Save Changes')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="user-profile-edit-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          {mutation.status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{mutation.error.message}</AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('users.details.edit_dialog.name_label', 'Name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('users.details.edit_dialog.name_placeholder', 'Enter user name')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('users.details.edit_dialog.role_label', 'Role')}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.details.edit_dialog.role_placeholder', 'Select a role')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roleList?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('users.details.edit_dialog.phone_label', 'Telefon')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('users.details.edit_dialog.phone_placeholder', 'Telefon numarası girin')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('users.details.edit_dialog.status_label', 'Status')}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.details.edit_dialog.status_placeholder', 'Select a status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.entries(UserStatusProps).map(
                          ([status, { label }]) => (
                            <SelectItem key={status} value={status}>
                              {t('users.status.' + label.toLowerCase(), label)}
                            </SelectItem>
                          ),
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('users.details.edit_dialog.password_label', 'Yeni Şifre')}</FormLabel>
                <FormControl>
                  <div className="relative flex gap-2">
                    <Input
                      type="password"
                      placeholder={t('users.details.edit_dialog.password_placeholder', 'Mevcut şifreyi korumak için boş bırakın')}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resetMutation.status === 'pending'}
                      onClick={() => resetMutation.mutate()}
                      className="shrink-0"
                    >
                      {resetMutation.status === 'pending' ? (
                        <LoaderCircleIcon className="animate-spin size-4" />
                      ) : (
                        <>
                          <Mail />
                          {t('users.details.edit_dialog.send_reset_email', 'Sıfırlama Linki Gönder')}
                        </>
                      )}
                    </Button>
                  </div>
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('users.details.edit_dialog.password_help', 'En az 8 karakter uzunluğunda olmalı, büyük harf, küçük harf ve rakam içermelidir.')}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </RightDrawer>
  );
};

export default UserProfileEditDialog;
