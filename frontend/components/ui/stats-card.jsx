'use client';

import * as React from 'react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatsCard({
  icon,
  iconDark,
  value,
  label,
  className,
  bgClassName = 'stats-card-bg',
}) {
  const renderIcon = () => {
    if (!icon) return null;

    // If icon is a string, check if it's a path or filename
    if (typeof icon === 'string') {
      const isPath = icon.includes('/') || icon.includes('.');
      const srcLight = isPath ? toAbsoluteUrl(icon) : toAbsoluteUrl(`/media/brand-logos/${icon}`);
      
      if (iconDark) {
        const srcDark = iconDark.includes('/') || iconDark.includes('.') 
          ? toAbsoluteUrl(iconDark) 
          : toAbsoluteUrl(`/media/brand-logos/${iconDark}`);
        return (
          <>
            <img
              src={srcLight}
              className="dark:hidden w-7 mt-4 ms-5 h-7 object-contain"
              alt="icon"
            />
            <img
              src={srcDark}
              className="light:hidden w-7 mt-4 ms-5 h-7 object-contain"
              alt="icon"
            />
          </>
        );
      }

      return (
        <img
          src={srcLight}
          className="w-7 mt-4 ms-5 h-7 object-contain"
          alt="icon"
        />
      );
    }

    // If it's a Lucide icon or custom React component/element
    return (
      <div className="mt-4 ms-5 w-7 h-7 flex items-center justify-start text-foreground">
        {icon}
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          .stats-card-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3.png')}');
          }
          .dark .stats-card-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3-dark.png')}');
          }
        `}
      </style>
      <Card className={cn("h-full", className)}>
        <CardContent className={cn("p-0 flex flex-col justify-between gap-6 h-full bg-cover rtl:bg-[left_top_-1.7rem] bg-[right_top_-1.7rem] bg-no-repeat", bgClassName)}>
          {renderIcon()}
          <div className="flex flex-col gap-1 pb-4 px-5">
            <span className="text-3xl font-semibold text-mono">
              {value}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {label}
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
