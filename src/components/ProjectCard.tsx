
'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
  // Structure finale et robuste :
  // 1. Le conteneur externe gère le style de la bordure (background/gradient) et l'ombre.
  // 2. Un conteneur enfant (avec marge) contient tout le contenu visible (image, titre).
  //    Sa marge laisse apparaître l'arrière-plan du parent, créant la bordure.
  return (
    <div
      className={cn(
        "relative rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group",
        className
      )}
      style={style} // Applique le background (gradient ou couleur) et l'ombre
      onClick={onClick}
    >
      <div className="flex flex-col h-full m-[2px] rounded-[calc(var(--radius)-2px)] bg-card overflow-hidden">
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
        <div className="p-4 bg-card/50 backdrop-blur-md">
          <h3 className="font-headline text-lg leading-tight">{item.title}</h3>
        </div>
      </div>
    </div>
  );
}
