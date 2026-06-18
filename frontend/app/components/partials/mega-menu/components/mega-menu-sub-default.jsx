'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import { Badge } from '@/components/ui/badge';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';

const translateTitle = (title, t) => {
  if (!title) return '';
  const key = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t ? t(`sidebar.${key}`, title) : title;
};

const MegaMenuSubDefault = (items, t) => {
  const pathname = usePathname();
  const { isActive } = useMenu(pathname);

  const buildItems = (items) => {
    return items.map((item, index) => {
      if (item.children) {
        return (
          <div key={index}>
            <div className="pt-1">
              <span className="text-secondary-foreground font-medium text-sm p-2.5">
                {translateTitle(item.title, t)}
              </span>
            </div>
            {buildItems(item.children)}
          </div>
        );
      } else {
        return (
          <NavigationMenuLink key={index} asChild>
            <Link
              {...(isActive(item.path) && { 'data-active': true })}
              href={item.path || ''}
              className={cn(
                'flex flex-row items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent/50 text-sm',
                '[&_svg]:text-muted-foreground hover:[&_svg]:text-primary [&[data-active=true]_svg]:text-primary',
              )}
            >
              {item.icon && <item.icon className="size-4" />}
              {translateTitle(item.title, t)}
              {item.disabled && (
                <Badge variant="secondary" size="sm">
                  Soon
                </Badge>
              )}
              {item.badge && (
                <Badge variant="primary" size="sm" appearance="light">
                  {item.badge}
                </Badge>
              )}
            </Link>
          </NavigationMenuLink>
        );
      }
    });
  };

  return buildItems(items);
};

export { MegaMenuSubDefault };
