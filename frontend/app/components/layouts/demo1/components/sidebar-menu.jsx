'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { cn } from '@/lib/utils';
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';


export function SidebarMenu() {
  const pathname = usePathname();
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

  const translateHeading = (heading) => {
    if (!heading) return '';
    const key = heading.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return t(`sidebar.heading.${key}`, heading);
  };

  // Fetch dynamic content types
  const { data: contentTypes = [] } = useQuery({
    queryKey: ['admin-content-types'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/admin/content-types');
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
      } catch (e) {
        return [];
      }
    },
  });

  // Dynamically build/inject content types into Content Management children
  const dynamicMenu = useMemo(() => {
    const slugIconMap = {
      'homepage': '🏠 ',
      'about-us': '👥 ',
      'services': '🛠 ',
      'blog': '📰 ',
      'projects': '📁 ',
      'faq': '❓ ',
      'contact': '📞 ',
      'legal-pages': '⚖️ ',
      'categories': '🏷️ ',
      'team-members': '👥 ',
      'testimonials': '💬 ',
    };

    return MENU_SIDEBAR.map(item => {
      if (item.title === 'Content Management') {
        const dynamicChildren = [
          {
            title: 'Content Types',
            path: '/content-management/content-types',
          }
        ];
        contentTypes.forEach(type => {
          const emojiPrefix = slugIconMap[type.slug] || '📄 ';
          dynamicChildren.push({
            title: `${emojiPrefix}${type.name}`,
            path: `/content-management/content-entries?type=${type.slug}`,
          });
        });
        return {
          ...item,
          children: dynamicChildren
        };
      }
      return item;
    });
  }, [contentTypes]);

  // Memoize matchPath to prevent unnecessary re-renders
  const matchPath = useCallback(
    (path) =>
      path === pathname || (path.length > 1 && pathname.startsWith(path)),
    [pathname],
  );

  // Global classNames for consistent styling
  const classNames = {
    root: 'lg:ps-1 space-y-3',
    group: 'gap-px',
    label:
      'uppercase text-xs font-medium text-muted-foreground/70 pt-2.25 pb-px',
    separator: '',
    item: 'h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
    sub: '',
    subTrigger:
      'h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
    subContent: 'py-0',
    indicator: '',
  };

  const buildMenu = (items) => {
    return items.map((item, index) => {
      if (item.heading) {
        return buildMenuHeading(item, index);
      } else if (item.disabled) {
        return buildMenuItemRootDisabled(item, index);
      } else {
        return buildMenuItemRoot(item, index);
      }
    });
  };

  const buildMenuItemRoot = (item, index) => {
    if (item.children) {
      return (
        <AccordionMenuSub key={index} value={item.path || `root-${index}`}>
          <AccordionMenuSubTrigger className="text-sm font-medium">
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <span data-slot="accordion-menu-title">{translateTitle(item.title)}</span>
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `root-${index}`}
            className="ps-6"
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(item.children, 1)}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      return (
        <AccordionMenuItem
          key={index}
          value={item.path || ''}
          className="text-sm font-medium"
        >
          <Link
            href={item.path || '#'}
            className="flex items-center justify-start grow gap-2"
          >
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <span data-slot="accordion-menu-title">{translateTitle(item.title)}</span>
          </Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemRootDisabled = (item, index) => {
    return (
      <AccordionMenuItem
        key={index}
        value={`disabled-${index}`}
        className="text-sm font-medium"
      >
        {item.icon && <item.icon data-slot="accordion-menu-icon" />}
        <span data-slot="accordion-menu-title">{translateTitle(item.title)}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto me-[-10px]">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuItemChildren = (items, level = 0) => {
    return items.map((item, index) => {
      if (item.disabled) {
        return buildMenuItemChildDisabled(item, index, level);
      } else {
        return buildMenuItemChild(item, index, level);
      }
    });
  };

  const buildMenuItemChild = (item, index, level = 0) => {
    if (item.children) {
      return (
        <AccordionMenuSub
          key={index}
          value={item.path || `child-${level}-${index}`}
        >
          <AccordionMenuSubTrigger className="text-[13px]">
            {item.collapse ? (
              <span className="text-muted-foreground">
                <span className="hidden [[data-state=open]>span>&]:inline">
                  {translateTitle(item.collapseTitle)}
                </span>
                <span className="inline [[data-state=open]>span>&]:hidden">
                  {translateTitle(item.expandTitle)}
                </span>
              </span>
            ) : (
              translateTitle(item.title)
            )}
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `child-${level}-${index}`}
            className={cn(
              'ps-4',
              !item.collapse && 'relative',
              !item.collapse && (level > 0 ? '' : ''),
            )}
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(
                item.children,
                item.collapse ? level : level + 1,
              )}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      return (
        <AccordionMenuItem
          key={index}
          value={item.path || ''}
          className="text-[13px]"
        >
          <Link href={item.path || '#'}>{translateTitle(item.title)}</Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemChildDisabled = (item, index, level = 0) => {
    return (
      <AccordionMenuItem
        key={index}
        value={`disabled-child-${level}-${index}`}
        className="text-[13px]"
      >
        <span data-slot="accordion-menu-title">{translateTitle(item.title)}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto me-[-10px]">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuHeading = (item, index) => {
    return <AccordionMenuLabel key={index}>{translateHeading(item.heading)}</AccordionMenuLabel>;
  };

  return (
    <div className="kt-scrollable-y-hover flex flex-col grow shrink-0 py-5 px-5 lg:max-h-[calc(100vh-5.5rem)]">
      <AccordionMenu
        selectedValue={pathname}
        matchPath={matchPath}
        type="single"
        collapsible
        classNames={classNames}
      >
        {buildMenu(dynamicMenu)}
      </AccordionMenu>

      <div className="border-t border-border/50 mt-4 pt-4 shrink-0">
        <button
          onClick={() => signOut()}
          className="flex items-center justify-start w-full h-9 px-2.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/5 rounded-lg transition-colors gap-2 cursor-pointer"
        >
          <LogOut className="size-4" />
          <span>{t('sidebar.logout', 'Sign Out')}</span>
        </button>
      </div>
    </div>
  );
}
