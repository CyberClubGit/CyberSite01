
'use client';

import { useState, useMemo } from 'react';
import { Badge } from './ui/badge';
import { ViewerPanel } from './viewer-panel';
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import { Images, X, ArrowLeft, ArrowRight, FileText, Wrench, Cuboid, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';


type ProcessedItem = ReturnType<typeof import('@/lib/sheets').processGalleryLinks>;

interface CatalogItemDetailsProps {
  item: ProcessedItem;
}

interface ImageViewerState {
  isOpen: boolean;
  images: string[];
  selectedIndex: number;
}

const ImageGallery: React.FC<{ images: string[], onImageClick: (index: number) => void }> = ({ images, onImageClick }) => {
    const [mainImageIndex, setMainImageIndex] = useState(0);

    if (!images || images.length === 0) {
        return <div className="text-center text-muted-foreground p-8">Aucun visuel disponible.</div>;
    }

    const mainImageUrl = images[mainImageIndex];

    return (
        <div className="flex gap-4">
            {/* Main Image */}
            <div 
                className="relative flex-1 aspect-[3/4] rounded-lg overflow-hidden group border cursor-pointer bg-muted"
                onClick={() => onImageClick(mainImageIndex)}
            >
                {mainImageUrl && (
                    <Image
                        src={mainImageUrl}
                        alt={`Main gallery image`}
                        fill
                        sizes="(max-width: 1024px) 70vw, 50vw"
                        className="object-cover"
                    />
                )}
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="w-24 flex-shrink-0">
                    <ScrollArea className="h-full max-h-[500px]">
                    <div className="flex flex-col gap-2 pr-2">
                        {images.map((url, index) => (
                            <div 
                            key={index}
                            onClick={() => setMainImageIndex(index)}
                            className={cn(
                                "relative w-full aspect-[3/4] rounded-md overflow-hidden cursor-pointer border-2 transition-all",
                                mainImageIndex === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground'
                            )}
                            >
                            <Image
                                src={url}
                                alt={`Gallery thumbnail ${index + 1}`}
                                fill
                                sizes="100px"
                                className="object-cover"
                            />
                            </div>
                        ))}
                    </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};


export function CatalogItemDetails({ item }: CatalogItemDetailsProps) {
  const [imageViewer, setImageViewer] = useState<ImageViewerState>({ isOpen: false, images: [], selectedIndex: 0 });

  const tags = {
    Type: item.Type?.split(',').map(t => t.trim()).filter(Boolean) || [],
    Material: item.Material?.split(',').map(t => t.trim()).filter(Boolean) || [],
    Activity: item.Activity?.split(',').map(t => t.trim()).filter(Boolean) || [],
  };

  const openImageViewer = (images: string[], index: number) => {
    setImageViewer({ isOpen: true, images, selectedIndex: index });
  };
  const closeImageViewer = () => setImageViewer(prev => ({ ...prev, isOpen: false }));

  const nextImage = () => {
    setImageViewer(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % prev.images.length }));
  };
  const prevImage = () => {
    setImageViewer(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + prev.images.length) % prev.images.length }));
  };
  
  const hasGallery = item.galleryUrls && item.galleryUrls.length > 0;
  const has3DRenders = item.threeDRenderUrls && item.threeDRenderUrls.length > 0;
  const hasPackaging = item.packagingUrls && item.packagingUrls.length > 0;
  
  const galleryTabs = [
    { name: 'Galerie', icon: Images, content: hasGallery ? <ImageGallery images={item.galleryUrls} onImageClick={(index) => openImageViewer(item.galleryUrls, index)} /> : null, available: hasGallery },
    { name: 'Rendus 3D', icon: Cuboid, content: has3DRenders ? <ImageGallery images={item.threeDRenderUrls} onImageClick={(index) => openImageViewer(item.threeDRenderUrls, index)} /> : null, available: has3DRenders },
    { name: 'Packaging', icon: Package, content: hasPackaging ? <ImageGallery images={item.packagingUrls} onImageClick={(index) => openImageViewer(item.packagingUrls, index)} /> : null, available: hasPackaging },
  ].filter(tab => tab.available);


  return (
    <>
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

                {/* Galleries Section */}
                {galleryTabs.length > 0 && (
                    <Tabs defaultValue={galleryTabs[0].name} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            {galleryTabs.map(tab => (
                                <TabsTrigger key={tab.name} value={tab.name}>
                                    <tab.icon className="mr-2 h-4 w-4" />
                                    {tab.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                         {galleryTabs.map(tab => (
                            <TabsContent key={tab.name} value={tab.name} className="mt-4">
                                {tab.content || <div className="text-center text-muted-foreground p-8">Aucun visuel disponible pour cette catégorie.</div>}
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
                

                {/* Tabs Section for Description/Tech Details */}
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description">
                        <FileText className="mr-2 h-4 w-4" />
                        Description
                    </TabsTrigger>
                    <TabsTrigger value="tech">
                        <Wrench className="mr-2 h-4 w-4" />
                        Détails Techniques
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="mt-4 p-4 border rounded-md">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.description || "No description available."}
                    </p>
                  </TabsContent>
                  <TabsContent value="tech" className="mt-4 p-4 border rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Détails techniques à venir.
                    </p>
                  </TabsContent>
                </Tabs>

              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:w-1/3 w-full lg:border-l lg:pl-6">
          <ViewerPanel modelUrl={item.stlUrl} />
        </div>
      </div>
      
      {/* Image Viewer Dialog */}
      <Dialog open={imageViewer.isOpen} onOpenChange={(isOpen) => !isOpen && closeImageViewer()}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-2 bg-transparent border-0" showCloseButton={false}>
            <DialogHeader className="sr-only">
              <DialogTitle>Visionneuse d'image</DialogTitle>
              <DialogDescription>
                Agrandissement de l'image sélectionnée. Utilisez les flèches pour naviguer.
              </DialogDescription>
            </DialogHeader>
            {imageViewer.isOpen && (
                <div className="relative w-full h-full">
                    <Image
                        src={imageViewer.images[imageViewer.selectedIndex]}
                        alt={`Image ${imageViewer.selectedIndex + 1}`}
                        fill
                        className="object-contain"
                    />
                </div>
            )}
            <Button
                variant="ghost"
                size="icon"
                onClick={closeImageViewer}
                className="absolute top-2 right-2 h-10 w-10 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm z-10"
            >
                <X />
            </Button>
            {imageViewer.images.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
                    >
                        <ArrowLeft />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
                    >
                        <ArrowRight />
                    </Button>
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
