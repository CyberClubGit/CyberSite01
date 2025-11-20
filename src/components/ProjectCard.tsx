
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
      {/* Ce conteneur intérieur est maintenant transparent mais floute l'arrière-plan */}
      <div className="bg-transparent backdrop-blur-md rounded-md flex flex-col h-full overflow-hidden">
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
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
      </div>
    </div>
  );
}
