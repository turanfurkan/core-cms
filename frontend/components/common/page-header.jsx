'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from './container';

export default function PageHeader({ 
  title, 
  description, 
  breadcrumbs = [], 
  badge = null,
  className 
}) {
  return (
    <div className={cn(
      "w-full pt-8 pb-6 bg-transparent border-b border-zinc-200/10 dark:border-white/5",
      className
    )}>
      <Container>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Left Side: Title and Subtitle */}
          <div className="space-y-1.5 text-left">
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 select-none w-max">
                {badge}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#03112b] dark:text-white uppercase select-none leading-none">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium select-none">
                {description}
              </p>
            )}
          </div>

          {/* Right Side: Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-y-1 gap-x-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none md:self-end md:pb-1">
            <Link 
              href="/" 
              className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white transition-colors duration-200"
            >
              <Home className="size-3.5" />
              <span>Anasayfa</span>
            </Link>
            
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="size-3.5 text-zinc-400" />
                {crumb.href ? (
                  <Link 
                    href={crumb.href} 
                    className="hover:text-zinc-900 dark:hover:text-white transition-colors duration-200"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-zinc-800 dark:text-zinc-300 font-bold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

        </div>
      </Container>
    </div>
  );
}
