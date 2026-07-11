'use client';

import * as Icons from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DefaultCard({ item, index }) {
  const IconComponent = Icons[item.iconName] || Icons.Sparkles;

  return (
    <Card className="group border border-border bg-card shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 rounded-2xl overflow-hidden">
      <CardContent className="p-6 sm:p-7 space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
          <IconComponent className="size-6 shrink-0" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold text-foreground leading-snug">
            {item.title}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {item.desc}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
