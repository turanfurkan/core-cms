'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import { useTranslation } from '@/hooks/useTranslation';

const translateTitle = (title, t) => {
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

function Toolbar({ children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 pb-7.5">
      {children}
    </div>
  );
}

function ToolbarActions({ children }) {
  return <div className="flex items-center gap-2.5">{children}</div>;
}

function ToolbarBreadcrumbs() {
  const pathname = usePathname();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const items = getBreadcrumb(MENU_SIDEBAR);
  const { t } = useTranslation();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex [.header_&]:below-lg:hidden items-center gap-1.25 text-xs lg:text-sm font-medium mb-2.5 lg:mb-0">
      <div className="breadcrumb flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const active = item.path ? isActive(item.path) : false;

          return (
            <Fragment key={index}>
              {item.path ? (
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center gap-1',
                    active
                      ? 'text-mono'
                      : 'text-muted-foreground hover:text-primary',
                  )}
                >
                  {translateTitle(item.title, t)}
                </Link>
              ) : (
                <span
                  className={cn(isLast ? 'text-mono' : 'text-muted-foreground')}
                >
                  {translateTitle(item.title, t)}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="size-3.5 muted-foreground" />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ToolbarHeading({ title = '', description }) {
  const pathname = usePathname();
  const { getCurrentItem } = useMenu(pathname);
  const item = getCurrentItem(MENU_SIDEBAR);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col justify-center gap-2">
      <h1 className="text-xl font-medium leading-none text-mono">
        {title ? translateTitle(title, t) : (item?.title ? translateTitle(item.title, t) : 'Untitled')}
      </h1>
      {description && (
        <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
          {description}
        </div>
      )}
    </div>
  );
}

export { Toolbar, ToolbarActions, ToolbarBreadcrumbs, ToolbarHeading };
