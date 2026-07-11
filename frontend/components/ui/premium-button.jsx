'use client';

import * as React from 'react';
import { Slot as SlotPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export default function PremiumButton({
  className,
  asChild = false,
  children,
  ...props
}) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button';

  return (
    <div className="relative group/prem select-none active:scale-[0.98] transition-transform duration-150 rounded-xl p-[1.2px] overflow-hidden bg-zinc-950/20 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/35 w-fit">
      {/* Dynamic Keyframes Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes prem-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes prem-sweep {
          0% { left: -100%; }
          15% { left: 200%; }
          100% { left: 200%; }
        }
        .prem-animate-spin {
          animation: prem-spin 5.5s linear infinite;
        }
        .group\/prem:hover .prem-animate-spin {
          animation-duration: 3.5s;
        }
        .prem-animate-sweep {
          animation: prem-sweep 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .prem-animate-spin,
          .prem-animate-sweep {
            animation: none !important;
            transform: none !important;
          }
          .group\/prem:hover .prem-animate-spin {
            animation: none !important;
          }
        }
      `}} />

      {/* 1. Rotating Conic Highlight Border */}
      <div className="absolute inset-[-1000%] bg-[conic-gradient(from_0deg,transparent_45%,rgba(255,255,255,0.4)_50%,transparent_55%)] group-hover/prem:bg-[conic-gradient(from_0deg,transparent_43%,rgba(255,255,255,0.85)_50%,transparent_57%)] transition-colors duration-300 prem-animate-spin pointer-events-none will-change-transform" />

      {/* 2. Light Sweep Sheen (outside Comp to satisfy Radix Slot single-child requirement) */}
      <div className="absolute inset-[1.2px] overflow-hidden rounded-[11px] pointer-events-none z-10">
        <div className="absolute top-0 bottom-0 left-[-100%] w-[60%] bg-gradient-to-r from-transparent via-white/12 to-transparent skew-x-[-25deg] prem-animate-sweep pointer-events-none" />
      </div>

      {/* 3. Actual Button Container */}
      <Comp
        className={cn(
          "relative flex items-center justify-center gap-2 rounded-[11px] bg-primary text-primary-foreground px-8 py-4 h-auto text-base font-semibold transition-all duration-300 hover:bg-primary/95 focus:outline-none overflow-hidden select-none cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    </div>
  );
}
