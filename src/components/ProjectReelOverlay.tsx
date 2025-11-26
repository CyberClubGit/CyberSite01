'use client';

import type { Project } from '@/lib/sheets';
import { X } from 'lucide-react';
import { HorizontalPdfViewer } from './Horizontal-pdf-viewer';
import { ScrollArea } from './ui/scroll-area';

interface ProjectReelOverlayProps {
  project: Project;
  onClose: () => void;
}

export function ProjectReelOverlay({ project, onClose }: ProjectReelOverlayProps) {
  return (
    <div
      className="absolute inset-0 bg-black/70 backdrop-blur-md z-10 flex flex-col p-4 animate-in fade-in-50"
      onClick={(e) => {
        // Prevent clicks inside the content from closing the overlay
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Main content area that is scrollable */}
      <ScrollArea className="flex-1 w-full text-white pt-12 pb-24">
        <div className="container mx-auto max-w-4xl space-y-8">
            {/* Title */}
            <h1 className="text-3xl font-bold font-headline text-center">
                {project.title}
            </h1>

            {/* Description */}
            {project.description && (
                <div>
                    <h2 className="font-headline text-lg mb-2">Description</h2>
                    <p className="text-sm opacity-80 whitespace-pre-wrap">
                        {project.description}
                    </p>
                </div>
            )}

            {/* PDF Gallery */}
            {project.pdfUrl && (
                <div>
                    <h2 className="font-headline text-lg mb-4">Galerie Document</h2>
                     <div className="mx-auto w-full max-w-lg">
                        <HorizontalPdfViewer files={[project.pdfUrl]} />
                    </div>
                </div>
            )}
        </div>
      </ScrollArea>

      {/* Close button fixed at the top right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
      >
        <X className="h-6 w-6" />
        <span className="sr-only">Fermer les détails</span>
      </button>
    </div>
  );
}
