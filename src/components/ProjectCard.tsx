
'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useParallax } from '@/hooks/useParallax';
import { useRef } from 'react';

type ProcessedItem = {
  displayImageUrl?: string | null;
  title: string;
  Activity?: string;
  [key: string]: any;
};

interface ProjectCardProps {
  item: ProcessedItem;
  onClick: () => void;
  style: React.CSSProperties; // We'll keep this for the glow color from useActivityColors
  className?: string;
}

export function ProjectCard({ item, onClick, style, className }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { cardStyle, glowStyle, handleMouseEnter, handleMouseLeave } = useParallax(cardRef);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative transition-transform duration-300 ease-out cursor-pointer group card-3d-wrapper",
        className
      )}
      onClick={onClick}
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
        <div className="p-4 bg-card/50 backdrop-blur-md">
          <h3 className="font-headline text-xl font-bold leading-tight">{item.title}</h3>
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
