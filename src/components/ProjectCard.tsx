
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
  style: React.CSSProperties; // We'll keep this for the glow color
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
        className="absolute -inset-1 rounded-xl blur-md transition-all duration-500 group-hover:blur-lg"
        style={{ background: style.background }}
      ></div>
      
      {/* The actual card content with frosted glass effect */}
      <div className="relative bg-card/20 backdrop-blur-md rounded-lg flex flex-col h-full overflow-hidden border border-white/10">
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
