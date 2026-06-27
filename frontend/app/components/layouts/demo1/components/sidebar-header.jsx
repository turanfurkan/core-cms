'use client';

import Link from 'next/link';
import { ChevronFirst } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useMemo } from 'react';

export function SidebarHeader() {
  const { settings, storeOption } = useSettings();

  const handleToggleClick = () => {
    storeOption(
      'layouts.demo1.sidebarCollapse',
      !settings.layouts.demo1.sidebarCollapse,
    );
  };

  const { data: settingsResponse } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/settings');
      if (!res.ok) throw new Error('Settings load error');
      return res.json();
    },
  });

  const settingsMap = useMemo(() => {
    if (!settingsResponse?.data) return {};
    const map = {};
    settingsResponse.data.forEach((item) => {
      map[item.key] = item.value;
    });
    return map;
  }, [settingsResponse]);

  const logoUrl = useMemo(() => {
    const rawLogo = settingsMap['site.logo'];
    if (!rawLogo) return null;
    return rawLogo.startsWith('http') ? rawLogo : `http://localhost:8000${rawLogo}`;
  }, [settingsMap]);

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-center px-3 lg:px-6 shrink-0 py-4">
      <Link href="/dashboard" className="flex items-center justify-center w-full">
        <div className="dark:hidden flex items-center justify-center w-full">
          {logoUrl ? (
            <img
              src={logoUrl}
              className="default-logo h-12 max-w-[190px] object-contain mx-auto"
              alt="Site Logo"
            />
          ) : (
            <img
              src={toAbsoluteUrl('/media/app/default-logo.svg')}
              className="default-logo h-[22px] max-w-none"
              alt="Default Logo"
            />
          )}

          <img
            src={toAbsoluteUrl('/media/app/mini-logo.svg')}
            className="small-logo h-[22px] max-w-none mx-auto"
            alt="Mini Logo"
          />
        </div>
        <div className="hidden dark:block flex items-center justify-center w-full">
          {logoUrl ? (
            <img
              src={logoUrl}
              className="default-logo h-12 max-w-[190px] object-contain mx-auto"
              alt="Site Logo"
            />
          ) : (
            <img
              src={toAbsoluteUrl('/media/app/default-logo-dark.svg')}
              className="default-logo h-[22px] max-w-none"
              alt="Default Dark Logo"
            />
          )}

          <img
            src={toAbsoluteUrl('/media/app/mini-logo.svg')}
            className="small-logo h-[22px] max-w-none mx-auto"
            alt="Mini Logo"
          />
        </div>
      </Link>
      <Button
        onClick={handleToggleClick}
        size="sm"
        mode="icon"
        variant="outline"
        className={cn(
          'size-7 absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
          settings.layouts.demo1.sidebarCollapse
            ? 'ltr:rotate-180'
            : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}
