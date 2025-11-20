
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

type ProcessedItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;
type GetActivityBadgeStyleFn = ReturnType<typeof useActivityColors>['getActivityBadgeStyle'];

interface ProjectDetailsProps {
  project: ProcessedItem;
  getActivityBadgeStyle: GetActivityBadgeStyleFn;
}

export function ProjectDetails({ project, getActivityBadgeStyle }: ProjectDetailsProps) {
  const videoUrl = getEmbeddableVideoUrl(project.reelUrl);
  
  // Utiliser les champs 'Members' et 'Activity' pour les métadonnées
  const members = project.Members?.split(',').map(m => m.trim()).filter(Boolean) || [];
  const activities = project.Activity?.split(',').map(t => t.trim()).filter(Boolean) || [];

  const pdfs = [project.pdfUrl, ...(project.galleryUrls || [])].filter(Boolean) as string[];

  // Utiliser la bonne clé pour le lien de l'institution
  const institutionLink = project['Liens Institution'];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 bg-transparent text-foreground h-full overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-8 h-full">

            {/* Colonne de Gauche */}
            <div className="lg:w-2/3 flex flex-col space-y-6">
                <ScrambleTitle 
                  text={project.title}
                  as="h1"
                  className="text-4xl md:text-5xl font-headline font-bold text-primary" 
                />
                
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

                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                    {activities.length > 0 && (
                         <div className="flex items-center gap-2 flex-wrap">
                           <Shapes className="h-4 w-4" />
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
                           <Users className="h-4 w-4" />
                           <span>{members.join(', ')}</span>
                        </div>
                    )}
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                
                {pdfs.length > 0 && (
                    <>
                        <div className="space-y-4">
                           <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Paperclip /> Documents & Galerie</h3>
                           <DocumentGallery files={pdfs} />
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    </>
                )}

                {project.description && (
                    <div className="text-base md:text-sm leading-relaxed text-muted-foreground">
                       {project.description.split('\n').map((paragraph, i) => <p key={i} className="mb-4">{paragraph}</p>)}
                    </div>
                )}
            </div>

            {/* Colonne de Droite */}
            {videoUrl && (
                <div className="lg:w-1/3 flex flex-col justify-end">
                    <div className="w-full">
                        <div className="space-y-4">
                            <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Film /> Reel</h3>
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
                </div>
            )}
        </div>
    </div>
  );
}
