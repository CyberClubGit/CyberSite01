
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
  // Structure finale et robuste pour une bordure dégradée qui respecte le border-radius.
  // Le conteneur externe gère l'ombre, le survol et le dégradé de la bordure.
  // Le conteneur interne contient le contenu réel (image + titre) et a son propre fond,
  // ce qui résoud les problèmes de superposition.
  return (
    <div
      className={cn(
        "relative rounded-lg p-[2px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group",
        className
      )}
      style={{ background: style.background, boxShadow: style.boxShadow }}
      onClick={onClick}
    >
      <div className="flex flex-col h-full bg-card overflow-hidden rounded-md">
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
        <div className="p-6 bg-card/50 backdrop-blur-md">
          <h3 className="font-headline text-lg leading-tight">{item.title}</h3>
        </div>
      </div>
    </div>
  );
}
