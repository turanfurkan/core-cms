'use client';

import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import { useTranslation } from '@/hooks/useTranslation';

export function Breadcrumb() {
  const pathname = usePathname();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const items = getBreadcrumb(MENU_SIDEBAR);
  const { t } = useTranslation();

  const translateTitle = (title) => {
    if (!title) return '';
    if (title.startsWith('Show ') && title.endsWith(' more')) {
      const match = title.match(/Show (\d+) more/);
      if (match) {
        const count = match[1];
        return t('sidebar.show_more_count', { count, defaultValue: `Show ${count} more` });
      }
    }
    const key = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return t(`sidebar.${key}`, title);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.25 text-xs lg:text-sm font-medium mb-2.5 lg:mb-0">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const active = item.path ? isActive(item.path) : false;

        return (
          <Fragment key={`root-${index}`}>
            <span
              className={cn(active ? 'text-mono' : 'text-secondary-foreground')}
              key={`item-${index}`}
            >
              {translateTitle(item.title)}
            </span>
            {!last && (
              <ChevronRight
                className="size-3.5 text-muted-foreground"
                key={`separator-${index}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
