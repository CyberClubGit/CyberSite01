
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
  // Le conteneur externe gère l'ombre et le survol.
  // Le conteneur interne utilise le dégradé comme arrière-plan et un 'background-clip'
  // pour le restreindre à la zone de la bordure (padding). Le contenu a son propre fond.
  return (
    <div
      className={cn(
        "relative rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group",
        className
      )}
      style={{ boxShadow: style.boxShadow }} // Applique l'ombre ici
      onClick={onClick}
    >
      <div 
        className="h-full rounded-lg p-[2px]"
        style={{ background: style.background }} // Le dégradé est appliqué ici en tant que fond
      >
        <div className="flex flex-col h-full bg-card rounded-[calc(var(--radius)-2px)] overflow-hidden">
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
    </div>
  );
}
