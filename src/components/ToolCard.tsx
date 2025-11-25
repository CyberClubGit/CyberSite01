'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

type ProcessedItem = {
  displayImageUrl?: string | null;
  title: string;
  Activity?: string;
  [key: string]: any;
};

interface ToolCardProps {
  item: ProcessedItem;
  style: React.CSSProperties; 
  className?: string;
}

export function ToolCard({ item, style, className }: ToolCardProps) {
  // CRITICAL FIX: Handle case-insensitivity for the 'App URL' column.
  const appUrl = item['App URL'] || item['App Url'] || item['app_url'] || item['Url app'];

  if (!appUrl) {
    // If no URL, render a non-interactive, disabled-looking card.
    return (
        <div
        className={cn(
            "relative bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border/20 opacity-60 cursor-not-allowed",
            className
        )}
        style={style}
        >
        <div className="p-4 bg-card/50">
            <h3 className="font-headline text-xl font-bold leading-tight text-muted-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">Lien non disponible</p>
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
    <a
      href={appUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "relative bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border/20 transition-all duration-300 hover:border-primary/80 hover:shadow-lg hover:-translate-y-1 group",
        className
      )}
      style={style}
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
    </a>
  );
}
