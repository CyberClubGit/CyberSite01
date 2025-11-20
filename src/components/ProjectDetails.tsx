
'use client';

import { 
    Shapes, 
    Users, 
    Link as LinkIcon,
    Paperclip,
    Film,
    Download,
} from 'lucide-react';
import { getEmbeddableVideoUrl } from '@/lib/linkConverter';
import { DocumentGallery } from './document-gallery';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import React from 'react';
import { ScrambleTitle } from './ScrambleTitle';
import { useActivityColors } from '@/lib/color-utils';
import { ScrollArea } from './ui/scroll-area';

type ProcessedItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;
type GetActivityBadgeStyleFn = ReturnType<typeof useActivityColors>['getActivityBadgeStyle'];

interface ProjectDetailsProps {
  project: ProcessedItem;
  getActivityBadgeStyle: GetActivityBadgeStyleFn;
}

export function ProjectDetails({ project, getActivityBadgeStyle }: ProjectDetailsProps) {
  const videoUrl = getEmbeddableVideoUrl(project.reelUrl);
  
  const members = project.Members?.split(',').map(m => m.trim()).filter(Boolean) || [];
  const activities = project.Activity?.split(',').map(t => t.trim()).filter(Boolean) || [];

  const mainPdf = project.pdfUrl || (project.galleryUrls && project.galleryUrls[0]) || null;
  const institutionLink = project['Liens Institution'];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 bg-transparent text-foreground h-full flex flex-col">
      {/* Main title outside the scroll areas for it to be always visible */}
      <ScrambleTitle 
        text={project.title}
        as="h1"
        className="text-4xl md:text-5xl font-headline font-bold text-primary mb-6 flex-shrink-0" 
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">

          {/* Colonne de Gauche - avec son propre scroll */}
          <ScrollArea className="lg:w-2/3 w-full h-full pr-4">
              <div className="flex flex-col gap-8">
                  {/* Section Description - contrainte en largeur */}
                  {project.description && (
                    <div className="max-w-prose">
                      <div className="border border-border/50 rounded-lg p-4 bg-muted/20">
                          <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {project.description}
                          </div>
                      </div>
                    </div>
                  )}

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                  {/* Section Galerie - contrainte en largeur et scrollable horizontalement */}
                  {mainPdf && (
                      <div className="flex flex-col space-y-4 min-w-0">
                          <h3 className="font-headline text-lg font-semibold flex items-center gap-2 flex-shrink-0"><Paperclip /> Documents & Galerie</h3>
                          <div className="border rounded-lg p-4 min-w-0">
                             <DocumentGallery pdfUrl={mainPdf} />
                          </div>
                      </div>
                  )}
              </div>
          </ScrollArea>

          {/* Colonne de Droite - avec son propre scroll */}
          <ScrollArea className="lg:w-1/3 w-full h-full">
            <div className="space-y-8 pr-4">
                <div className="space-y-6">
                    <div className="flex items-center flex-wrap gap-4 text-muted-foreground">
                        {project.Institution && <span className='font-semibold'>{project.Institution}</span>}
                        {institutionLink && (
                            <Button asChild variant="outline" size="sm">
                               <a href={institutionLink} target="_blank" rel="noopener noreferrer">
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Visiter le site
                               </a>
                            </Button>
                        )}
                        {project.stlUrl && (
                            <Button asChild variant="outline" size="sm">
                               <a href={project.stlUrl} target="_blank" rel="noopener noreferrer" download>
                                    <Download className="mr-2 h-4 w-4" />
                                    Télécharger STL
                               </a>
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 text-sm text-muted-foreground">
                        {activities.length > 0 && (
                             <div className="flex items-center gap-2 flex-wrap">
                               <Shapes className="h-4 w-4 mr-2" />
                               {activities.map(activity => (
                                 <Badge 
                                    key={activity} 
                                    variant="outline"
                                    style={getActivityBadgeStyle(activity)}
                                  >
                                    {activity}
                                  </Badge>
                               ))}
                            </div>
                        )}
                       {members.length > 0 && (
                            <div className="flex items-center gap-2">
                               <Users className="h-4 w-4 mr-2" />
                               <span>{members.join(', ')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {videoUrl && (
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Film /> Reel</h3>
                         <div className="w-[70%] mx-auto">
                            <div className="aspect-[9/16] w-full rounded-2xl overflow-hidden shadow-2xl border border-border">
                                <iframe
                                    key={videoUrl}
                                    src={videoUrl}
                                    title="Project Reel"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="w-full h-full"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </ScrollArea>
      </div>
    </div>
  );
}
