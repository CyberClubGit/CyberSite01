
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Brand, Project } from '@/lib/sheets';
import Image from 'next/image';
import { getEmbeddableVideoUrl } from '@/lib/linkConverter';
import { ProjectReelOverlay } from './ProjectReelOverlay';
import { Badge } from './ui/badge';
import { useActivityColors } from '@/lib/color-utils';

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
  const { getActivityBadgeStyle } = useActivityColors(brands);

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
          const activities = project.Activity?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];
          
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
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    <source src={videoSrc} type="video/mp4" />
                  </video>
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-black/40 pointer-events-none"></div>

              {/* Text Content Overlay - NOW AT THE TOP */}
              <div className="absolute top-4 left-4 right-4 text-white p-4 pointer-events-none">
                <h2 className="text-2xl font-bold font-headline drop-shadow-lg">{project.title}</h2>
                {activities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activities.map(activity => (
                      <Badge 
                        key={activity} 
                        variant="outline"
                        style={getActivityBadgeStyle(activity)}
                        className="text-white backdrop-blur-sm bg-black/20 border-white/30"
                      >
                        {activity}
                      </Badge>
                    ))}
                  </div>
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
