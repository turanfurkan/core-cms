import { z } from 'zod';

export const RoleSchema = (t) => z.object({
  name: z
    .string()
    .min(2, { message: t('roles.validation.name_required', 'Role name must be at least 2 characters long.') }),
  slug: z
    .string()
    .min(2, { message: t('roles.validation.slug_required', 'Slug must be at least 2 characters long.') }),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});
