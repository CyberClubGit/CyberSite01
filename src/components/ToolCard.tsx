
'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useParallax } from '@/hooks/useParallax';
import { useRef } from 'react';
import Link from 'next/link';
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
  const cardRef = useRef<HTMLAnchorElement>(null);
  const { cardStyle, glowStyle, handleMouseEnter, handleMouseLeave } = useParallax(cardRef);
  
  // CRITICAL FIX: Handle case-insensitivity for the 'App URL' column.
  const appUrl = item['App URL'] || item['App Url'] || item['app_url'] || item['Url app'];

  if (!appUrl) {
    // If no URL, render a non-interactive card.
    return (
        <div
        className={cn(
            "relative transition-transform duration-300 ease-out group card-3d-wrapper opacity-50 cursor-not-allowed",
            className
        )}
        style={{ ...cardStyle }}
        >
        <div 
            className="absolute -inset-1 rounded-xl blur-lg transition-all duration-300 opacity-50"
            style={{ ...style, ...glowStyle }}
        ></div>
        <div className="relative bg-transparent rounded-lg flex flex-col h-full overflow-hidden border border-border/20 card-3d-content">
            <div className="p-4 bg-card/50 backdrop-blur-md">
            <h3 className="font-headline text-xl font-bold leading-tight">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">Lien non disponible</p>
            </div>
            {item.displayImageUrl && (
            <div className="relative w-full aspect-square">
                <Image
                src={item.displayImageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500"
                />
            </div>
            )}
        </div>
        </div>
    );
  }

  return (
    <a
      ref={cardRef}
      href={appUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "relative transition-transform duration-300 ease-out group card-3d-wrapper block", // 'block' is important for <a> to take full space
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ ...cardStyle }}
    >
      {/* Element for the gradient glow */}
      <div 
        className="absolute -inset-1 rounded-xl blur-lg transition-all duration-300 opacity-50 group-hover:opacity-85"
        style={{ ...style, ...glowStyle }}
      ></div>
      
      {/* The actual card content with frosted glass effect */}
      <div className="relative bg-transparent rounded-lg flex flex-col h-full overflow-hidden border border-border/20 card-3d-content">
        <div className="p-4 bg-card/50 backdrop-blur-md flex justify-between items-start">
          <h3 className="font-headline text-xl font-bold leading-tight">{item.title}</h3>
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        {item.displayImageUrl && (
          <div className="relative w-full aspect-square">
            <Image
              src={item.displayImageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500"
            />
          </div>
        )}
      </div>
    </a>
  );
}
