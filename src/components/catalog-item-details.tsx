
'use client';

import { Badge } from './ui/badge';
import { ViewerPanel } from './viewer-panel';
import { ScrollArea } from './ui/scroll-area';

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

        <div className="flex-1 min-h-0">
          <ViewerPanel modelUrl={item.stlUrl} />
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:w-1/3 w-full lg:border-l lg:pl-6">
        <ScrollArea className="h-full">
          <div className="space-y-4 pr-4">
            <h3 className="font-headline text-lg font-semibold">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {item.description || "No description available."}
            </p>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
