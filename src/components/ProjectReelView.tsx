
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Brand, Project } from '@/lib/sheets';
import Image from 'next/image';
import { getEmbeddableVideoUrl } from '@/lib/linkConverter';
import { ProjectReelOverlay } from './ProjectReelOverlay';

interface ProjectReelViewProps {
  projects: Project[];
  brands: Brand[];
}

export function ProjectReelView({ projects, brands }: ProjectReelViewProps) {
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
        {projects.map((project, index) => {
          const videoSrc = getEmbeddableVideoUrl(project.reelUrl);
          
          return (
            <div
              className="relative flex-shrink-0 w-full h-full"
              key={project.id || index}
            >
              {/* Media (Video or Image) */}
              <div className="absolute inset-0 w-full h-full" onClick={() => toggleOverlay(project.id)}>
                {videoSrc ? (
                  <video
                    key={videoSrc}
                    className="w-full h-full object-cover"
                    src={videoSrc}
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
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none"></div>

              {/* Text Content Overlay - NOW AT THE TOP */}
              <div className="absolute top-4 left-4 right-4 text-white p-4 pointer-events-none">
                <h2 className="text-2xl font-bold font-headline drop-shadow-lg">{project.title}</h2>
                {project.Activity && (
                  <p className="text-sm opacity-90 mt-1 drop-shadow-md">{project.Activity}</p>
                )}
              </div>
              
              {/* The interactive overlay for details */}
              {activeOverlay === project.id && (
                <ProjectReelOverlay project={project} onClose={() => toggleOverlay(project.id)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
