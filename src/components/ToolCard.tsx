'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ExternalLink, Unplug } from 'lucide-react';
import Link from 'next/link';

// Function to create a URL-friendly slug from a title
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
};

type ProcessedItem = {
  displayImageUrl?: string | null;
  title: string;
  Activity?: string;
  [key: string]: any;
};

interface ToolCardProps {
  item: ProcessedItem;
}

export function ToolCard({ item }: ToolCardProps) {
  // CRITICAL FIX: Handle case-insensitivity for the 'App URL' column.
  const appUrl = item['App URL'] || item['App Url'] || item['app_url'];
  const toolSlug = slugify(item.title);

  if (!appUrl) {
    // If no URL, render a non-interactive, disabled-looking card.
    return (
        <div
        className={cn(
            "relative bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border/20 opacity-60 cursor-not-allowed"
        )}
        >
        <div className="p-4 bg-card/50">
            <h3 className="font-headline text-xl font-bold leading-tight text-muted-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2"><Unplug className="w-4 h-4" /> Lien non disponible</p>
        </div>
        {item.displayImageUrl && (
            <div className="relative w-full aspect-square mt-auto bg-muted">
                <Image
                src={item.displayImageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                />
            </div>
        )}
        </div>
    );
  }

  return (
    <Link
      href={`/tools/${toolSlug}`}
      className={cn(
        "relative bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border/20 transition-all duration-300 hover:border-primary/80 hover:shadow-lg hover:-translate-y-1 group"
      )}
    >
      <div className="p-4 bg-card/50 flex justify-between items-start">
        <div>
            <h3 className="font-headline text-xl font-bold leading-tight group-hover:text-primary">{item.title}</h3>
            {item.Description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.Description}</p>}
        </div>
        <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2 transition-transform group-hover:scale-110" />
      </div>
      {item.displayImageUrl && (
        <div className="relative w-full aspect-square mt-auto bg-muted">
            <Image
            src={item.displayImageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            />
        </div>
      )}
    </Link>
  );
}
