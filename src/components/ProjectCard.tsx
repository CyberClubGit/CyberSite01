
'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

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
  return (
    <div
      className={cn(
        "relative transition-all duration-500 hover:-translate-y-1 cursor-pointer group",
        className
      )}
      onClick={onClick}
    >
      {/* Element for the gradient glow */}
      <div 
        className="absolute -inset-1 rounded-xl blur-lg transition-all duration-500 opacity-50 group-hover:opacity-75"
        style={{ background: style.background }}
      ></div>
      
      {/* The actual card content with frosted glass effect */}
      <div className="relative bg-card/90 backdrop-blur-md rounded-lg flex flex-col h-full overflow-hidden border">
        <div className="p-4">
          <h3 className="font-headline text-xl font-bold leading-tight">{item.title}</h3>
        </div>
        {item.displayImageUrl && (
          <div className="relative w-full aspect-square">
            <Image
              src={item.displayImageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
      </div>
    </div>
  );
}
