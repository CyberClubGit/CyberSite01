
'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Type for a processed item, adjust as per your actual data structure
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
        "relative rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background/80 backdrop-blur-sm cursor-pointer group",
        className
      )}
      style={style}
      onClick={onClick}
    >
        <Card 
            className="flex flex-col overflow-hidden h-full bg-transparent border-0"
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
            <CardHeader>
            <CardTitle className="font-headline text-lg leading-tight">{item.title}</CardTitle>
            </CardHeader>
        </Card>
    </div>
  );
}
