'use client';

import React, { useRef, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Project } from '@/lib/sheets';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getEmbeddableVideoUrl } from '@/lib/linkConverter';

interface ProjectReelViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectReelView({ projects, onProjectClick }: ProjectReelViewProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    loop: false,
    align: 'start',
  });

  return (
    <div className="fixed inset-0 bg-black z-0" ref={emblaRef}>
      <div className="flex flex-col h-full">
        {projects.map((project, index) => (
          <div
            className="relative flex-shrink-0 w-full h-full"
            key={project.id || index}
            onClick={() => onProjectClick(project)}
          >
            {/* Media (Video or Image) */}
            <div className="absolute inset-0 w-full h-full">
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

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

            {/* Text Content Overlay */}
            <div className="absolute bottom-24 left-4 right-4 text-white p-4">
              <h2 className="text-xl font-bold font-headline">{project.title}</h2>
              {project.Activity && (
                <p className="text-sm opacity-80 mt-1">{project.Activity}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
