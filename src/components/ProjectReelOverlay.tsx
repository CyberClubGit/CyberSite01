
'use client';

import type { Project } from '@/lib/sheets';
import { X, Info, Images } from 'lucide-react';
import { HorizontalPdfViewer } from './Horizontal-pdf-viewer';
import { ScrollArea } from './ui/scroll-area';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface ProjectReelOverlayProps {
  project: Project;
  onClose: () => void;
}

export function ProjectReelOverlay({ project, onClose }: ProjectReelOverlayProps) {
  const [activeSlide, setActiveSlide] = useState<'info' | 'gallery'>('info');

  useEffect(() => {
    const timer = setTimeout(() => {
      // Switch to gallery only if info is still active
      if (activeSlide === 'info' && project.pdfUrl) {
        setActiveSlide('gallery');
      }
    }, 5000);

    // Cleanup timer on component unmount or when slide changes
    return () => clearTimeout(timer);
  }, [activeSlide, project.pdfUrl]);
  
  const activities = project.Activity?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];

  return (
    <div
      className="absolute inset-0 bg-black/70 backdrop-blur-md z-10 flex flex-col p-4 animate-in fade-in-50 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative flex-1 w-full text-white pt-12 pb-24 overflow-hidden">
        <div className="container mx-auto max-w-4xl h-full flex flex-col">
          {/* Info Slide */}
          <div className={cn(
            "absolute inset-x-4 top-12 bottom-24 transition-transform duration-500 ease-in-out",
            activeSlide === 'info' ? 'translate-x-0' : '-translate-x-[110%]'
          )}>
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold font-headline">
                  {project.title}
                </h1>
                 {activities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activities.map(activity => (
                      <Badge key={activity} variant="secondary" className="bg-white/10 text-white border-white/20">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                )}
                {project.description && (
                  <div>
                    <h2 className="font-headline text-lg mb-2">Description</h2>
                    <p className="text-xs opacity-80 whitespace-pre-wrap">
                      {project.description}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Gallery Slide */}
          <div className={cn(
            "absolute inset-x-4 top-12 bottom-24 transition-transform duration-500 ease-in-out",
            activeSlide === 'gallery' ? 'translate-x-0' : 'translate-x-[110%]'
          )}>
            {project.pdfUrl ? (
                <div className="h-full flex flex-col justify-center">
                    <h2 className="font-headline text-lg mb-4 text-center">Galerie Document</h2>
                    <div className="mx-auto w-full max-w-lg">
                        <HorizontalPdfViewer files={[project.pdfUrl]} />
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Aucune galerie disponible.</p>
                </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Slide Navigation */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
        <button 
          onClick={() => setActiveSlide('info')}
          className={cn(
            "rounded-full p-3 transition-colors",
            activeSlide === 'info' ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'
          )}
        >
          <Info className="h-6 w-6" />
        </button>
        <button 
          onClick={() => setActiveSlide('gallery')}
          disabled={!project.pdfUrl}
          className={cn(
            "rounded-full p-3 transition-colors",
            activeSlide === 'gallery' ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30',
            !project.pdfUrl && "opacity-50 cursor-not-allowed"
          )}
        >
          <Images className="h-6 w-6" />
        </button>
      </div>

      {/* Close button fixed at the top right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors z-20"
      >
        <X className="h-6 w-6" />
        <span className="sr-only">Fermer les détails</span>
      </button>
    </div>
  );
}
