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
  phone: z.string().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')).refine((val) => {
    if (!val) return true; // optional
    return val.length >= 8 && /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val);
  }, {
    message: t('users.validation.password_strong', 'Password must be at least 8 characters and include uppercase, lowercase, and numeric characters.'),
  }),
});
