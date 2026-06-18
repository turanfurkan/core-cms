'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon, UserPlus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRoleSelectQuery } from '../../roles/hooks/use-role-select-query';
import { UserAddSchema } from '../forms/user-add-schema';

const UserAddDialog = ({ open, closeDialog }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch available roles
  const { data: roleList } = useRoleSelectQuery();

  const form = useForm({
    resolver: zodResolver(UserAddSchema(t)),
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await apiFetch('/api/user-management/users', {
        method: 'POST',
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
      const message = t('users.dialog.success_message', 'User added successfully');
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
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
      closeDialog();
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
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.dialog.add_title', 'Add User')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogBody className="pt-2.5 space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.dialog.name_label', 'Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('users.dialog.name_placeholder', 'Enter name')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.dialog.email_label', 'Email')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('users.dialog.email_placeholder', 'Enter user email')} {...field} />
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
                    <FormLabel>{t('users.dialog.role_label', 'Role')}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('users.dialog.role_placeholder', 'Select a role')} />
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
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                <X />
                {t('users.dialog.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || isProcessing}
              >
                {isProcessing ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <UserPlus />
                )}
                {t('users.dialog.submit_add', 'Add user')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserAddDialog;
