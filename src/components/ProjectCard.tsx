
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
  // Structure unifiée pour toutes les cartes.
  // Le conteneur externe gère la "bordure" via son arrière-plan.
  // La carte interne a une marge pour laisser apparaître cette bordure.
  return (
    <div
      className={cn(
        "relative rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group",
        className
      )}
      style={style} // Applique le background (gradient ou couleur) et l'ombre
      onClick={onClick}
    >
      <Card
        className="flex flex-col overflow-hidden h-full m-[2px] rounded-[calc(var(--radius)-2px)] bg-card/50 backdrop-blur-sm"
      >
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
        <CardHeader className="bg-card/50 backdrop-blur-md">
          <CardTitle className="font-headline text-lg leading-tight">{item.title}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
