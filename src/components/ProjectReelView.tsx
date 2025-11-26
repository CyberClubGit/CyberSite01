'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Project } from '@/lib/sheets';
import Image from 'next/image';
import { getEmbeddableVideoUrl } from '@/lib/linkConverter';
import { ProjectReelOverlay } from './ProjectReelOverlay';

interface ProjectReelViewProps {
  projects: Project[];
}

export function ProjectReelView({ projects }: ProjectReelViewProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    loop: false,
    align: 'start',
  });
  
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  const toggleOverlay = (projectId: string) => {
    setActiveOverlay(prev => (prev === projectId ? null : projectId));
  };
  
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        scrollPrev();
      } else if (event.key === 'ArrowDown') {
        scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scrollPrev, scrollNext]);

  return (
    <div className="fixed inset-0 bg-black z-0" ref={emblaRef}>
      <div className="flex flex-col h-full">
        {projects.map((project, index) => (
          <div
            className="relative flex-shrink-0 w-full h-full"
            key={project.id || index}
          >
            {/* Media (Video or Image) */}
            <div className="absolute inset-0 w-full h-full" onClick={() => toggleOverlay(project.id)}>
              {project.reelUrl ? (
                <video
                  key={project.reelUrl}
                  className="w-full h-full object-cover"
                  src={getEmbeddableVideoUrl(project.reelUrl) || ''}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                project.displayImageUrl && (
                  <Image
                    src={project.displayImageUrl}
                    alt={project.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                )
              )}
            </div>

            {/* Gradient Overlay for Text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>

            {/* Text Content Overlay */}
            <div className="absolute bottom-24 left-4 right-4 text-white p-4 pointer-events-none">
              <h2 className="text-xl font-bold font-headline">{project.title}</h2>
              {project.Activity && (
                <p className="text-sm opacity-80 mt-1">{project.Activity}</p>
              )}
            </div>
            
            {/* The new interactive overlay */}
            {activeOverlay === project.id && (
              <ProjectReelOverlay project={project} onClose={() => toggleOverlay(project.id)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
