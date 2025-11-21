
'use client';

import { Badge } from './ui/badge';
import { ViewerPanel } from './viewer-panel';
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import { Images, ExternalLink } from 'lucide-react';

type ProcessedItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;

interface CatalogItemDetailsProps {
  item: ProcessedItem;
}

export function CatalogItemDetails({ item }: CatalogItemDetailsProps) {
  const tags = {
    Type: item.Type?.split(',').map(t => t.trim()).filter(Boolean) || [],
    Material: item.Material?.split(',').map(t => t.trim()).filter(Boolean) || [],
    Activity: item.Activity?.split(',').map(t => t.trim()).filter(Boolean) || [],
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full w-full">
      {/* Left Panel */}
      <div className="lg:w-2/3 w-full flex flex-col gap-4">
        <h2 className="text-2xl font-headline font-bold text-primary flex-shrink-0">{item.title}</h2>
        
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {tags.Type.map(tag => <Badge key={tag} variant="secondary">Type: {tag}</Badge>)}
          {tags.Material.map(tag => <Badge key={tag} variant="secondary">Material: {tag}</Badge>)}
          {tags.Activity.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
        </div>

        <div className="flex-1 min-h-0 pt-4">
          <ScrollArea className="h-full">
            <div className="space-y-8 pr-4">

              {/* Gallery Section */}
              {item.galleryUrls && item.galleryUrls.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                    <Images />
                    Galerie
                  </h3>
                  <div className="flex overflow-x-auto gap-4 pb-4">
                    {item.galleryUrls.map((url, index) => (
                      <a 
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative flex-shrink-0 w-48 h-48 rounded-lg overflow-hidden group border"
                      >
                        <Image
                          src={url}
                          alt={`Gallery image ${index + 1}`}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="w-8 h-8 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Section */}
              <div className="space-y-4">
                <h3 className="font-headline text-lg font-semibold">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.description || "No description available."}
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:w-1/3 w-full lg:border-l lg:pl-6">
        <ViewerPanel modelUrl={item.stlUrl} />
      </div>
    </div>
  );
}
