'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * A reusable, responsive countdown component that calculates time remaining to a target date
 * 
 * @param {Date|string|number} targetDate - The target date/time for the countdown
 * @param {string} [className] - Optional Tailwind classes for the container
 * @param {boolean} [showLabels=true] - Whether to show labels (Gün, Saat etc.)
 * @param {string} [locale='tr'] - Locale for labels (supports 'tr' or 'en')
 * @param {function} [onComplete] - Optional callback when countdown reaches zero
 */
export function Countdown({
  targetDate,
  className,
  showLabels = true,
  locale = 'tr',
  onComplete,
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
      setIsComplete(true);
      if (onComplete) onComplete();
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  }, [targetDate, onComplete]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const labels = {
    tr: ['Gün', 'Saat', 'Dakika', 'Saniye'],
    en: ['Days', 'Hours', 'Minutes', 'Seconds'],
  };

  const units = [
    { key: 'days', value: timeLeft.days },
    { key: 'hours', value: timeLeft.hours },
    { key: 'minutes', value: timeLeft.minutes },
    { key: 'seconds', value: timeLeft.seconds },
  ];

  return (
    <div className={cn('flex items-center gap-3 md:gap-4', className)}>
      {units.map((unit, index) => (
        <div key={unit.key} className="flex flex-col items-center min-w-[48px] md:min-w-[64px]">
          {/* Number Box */}
          <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-900/40 shadow-sm">
            <span className="text-xl md:text-2xl font-black text-foreground">
              {String(unit.value).padStart(2, '0')}
            </span>
          </div>
          {/* Label */}
          {showLabels && (
            <span className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {labels[locale]?.[index] || labels['en'][index]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
