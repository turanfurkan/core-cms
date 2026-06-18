import { z } from 'zod';

export const UserProfileSchema = (t) => z.object({
  name: z.string().nonempty({
    message: t('users.validation.name_required', 'Name is required.'),
  }),
  roleId: z.string().nonempty({
    message: t('users.validation.role_required', 'Role ID is required.'),
  }),
  status: z.string().nonempty({
    message: t('users.validation.status_required', 'Status is required.'),
  }),
});
