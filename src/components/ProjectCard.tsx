
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
  style: React.CSSProperties;
  className?: string;
}

export function ProjectCard({ item, onClick, style, className }: ProjectCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg p-[2px] transition-all duration-500 hover:shadow-lg hover:-translate-y-1 cursor-pointer group",
        className
      )}
      style={{ background: style.background, boxShadow: style.boxShadow }}
      onClick={onClick}
    >
      <div className="flex flex-col h-full overflow-hidden rounded-md bg-card/20 backdrop-blur-md">
        <div className="p-6">
          <h3 className="font-headline text-xl font-bold leading-tight">{item.title}</h3>
        </div>
         {item.displayImageUrl && (
          <div className="relative w-full bg-muted aspect-square">
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
