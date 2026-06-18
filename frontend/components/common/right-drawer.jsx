'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function RightDrawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
  size = 'md', // sm, md, lg, xl, 2xl, 3xl
}) {
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex flex-col h-full justify-between p-0 gap-0 bg-background shadow-2xl border-s border-border',
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border flex flex-row items-center justify-between shrink-0">
          <SheetTitle className="text-base font-bold text-foreground me-8 truncate">
            {title}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <SheetFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-end gap-2 sm:space-x-0">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
