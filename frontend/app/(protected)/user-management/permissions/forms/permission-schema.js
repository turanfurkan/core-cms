import { z } from 'zod';

export const PermissionSchema = (t) => z.object({
  name: z
    .string()
    .nonempty({ message: t('permissions.validation.name_required', 'Permission name must be at least 2 characters long.') })
    .min(2, { message: t('permissions.validation.name_required', 'Permission name must be at least 2 characters long.') })
    .max(30, { message: t('permissions.validation.name_max', 'Name must not exceed 30 characters.') }),
  slug: z
    .string()
    .nonempty({ message: t('permissions.validation.slug_required', 'Slug must be at least 2 characters long.') })
    .min(2, { message: t('permissions.validation.slug_required', 'Slug must be at least 2 characters long.') })
    .max(20, { message: t('permissions.validation.slug_max', 'Slug must not exceed 20 characters.') }),
  description: z
    .string()
    .max(500, { message: t('permissions.validation.desc_max', 'Description must not exceed 500 characters.') })
    .optional(),
});
