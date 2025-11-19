
'use client';

import { 
    Tag, 
    Users, 
    Link as LinkIcon,
    Paperclip,
    Film,
} from 'lucide-react';
import { getEmbeddableVideoUrl } from '@/lib/linkConverter';
import { HorizontalPdfViewer } from './HorizontalPdfViewer';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import React from 'react';

type ProcessedItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;

interface ProjectDetailsProps {
  project: ProcessedItem;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const videoUrl = getEmbeddableVideoUrl(project.reelUrl);
  const members = project.Members?.split(',').map(m => m.trim()) || [];
  const tags = project.Tags?.split(',').map(t => t.trim()) || [];
  const pdfs = [project.pdfUrl, ...(project.galleryUrls || [])].filter(Boolean) as string[];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 bg-background text-foreground">
        <div className="flex flex-col lg:flex-row gap-8 h-full">

            {/* Colonne de Gauche */}
            <div className="lg:w-2/3 flex flex-col space-y-6">
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary" style={{ textShadow: '0 0 5px currentColor, 0 0 10px currentColor' }}>
                    {project.title}
                </h1>
                
                <div className="flex items-center gap-4 text-muted-foreground">
                    <span className='font-semibold'>{project.Institution}</span>
                    {project.Link && (
                        <Button asChild variant="outline" size="sm">
                           <a href={project.Link} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Voir
                           </a>
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                   {members.length > 0 && (
                        <div className="flex items-center gap-2">
                           <Users className="h-4 w-4" />
                           <span>{members.join(', ')}</span>
                        </div>
                    )}
                    {tags.length > 0 && (
                         <div className="flex items-center gap-2 flex-wrap">
                           <Tag className="h-4 w-4" />
                           {tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                    )}
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                
                {project.description && (
                    <div className="text-[0.625rem] md:text-xs leading-relaxed text-muted-foreground">
                       {project.description.split('\n').map((paragraph, i) => <p key={i} className="mb-4">{paragraph}</p>)}
                    </div>
                )}
                
                {pdfs.length > 0 && (
                    <>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        <div className="space-y-4">
                           <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Paperclip /> Documents</h3>
                           <HorizontalPdfViewer files={pdfs} />
                        </div>
                    </>
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
