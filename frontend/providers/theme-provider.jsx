'use client';
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </NextThemesProvider>
  );
}
