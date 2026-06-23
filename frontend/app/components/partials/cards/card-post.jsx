'use client';

import Link from 'next/link';
import { Clock9 } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card } from '@/components/ui/card';

const CardPost = ({ image, label, description, time, href = '#', labelHref = '#' }) => {
  return (
    <Card className="shadow-none w-full mb-5">
      <div
        className="rounded-t-xl w-full h-[240px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${image && (image.startsWith('/') || image.startsWith('http')) ? toAbsoluteUrl(image) : toAbsoluteUrl(`/media/images/600x400/${image || '1.jpg'}`)})`,
        }}
      ></div>
      <div className="card-border card-rounded-b grid gap-1.5 px-5 py-4">
        <Link
          href={labelHref}
          className="font-medium text-orange-400 text-sm hover:text-primary"
        >
          {label}
        </Link>
        <Link
          href={href}
          className="font-medium text-mono text-lg leading-6 mb-1.5 hover:text-primary"
        >
          {description}
        </Link>
        <time className="flex items-center gap-1.5 text-sm font-medium text-secondary-foreground leading-none">
          <Clock9 size={16} className="text-lg text-muted-foreground" /> {time}
        </time>
      </div>
    </Card>
  );
};

export { CardPost };
