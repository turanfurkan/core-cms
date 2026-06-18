import { z } from 'zod';

export const UserAddSchema = (t) => z.object({
  name: z
    .string()
    .nonempty({ message: t('users.validation.name_required', 'Name is required.') })
    .min(2, { message: t('users.validation.name_min', 'Name must be at least 2 characters long.') })
    .max(50, { message: t('users.validation.name_max', 'Name must not exceed 50 characters.') }),
  email: z.string().email({
    message: t('users.validation.email_invalid', 'Please enter a valid email address.'),
  }),
  roleId: z.string().nonempty({
    message: t('users.validation.role_required', 'Role ID is required.'),
  }),
});
